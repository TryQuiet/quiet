import EventEmitter from 'node:events'
import { jest } from '@jest/globals'
import { Events, MemoryStorage, type EventsType } from '@orbitdb/core'
import { MessageType, type PublicChannel } from '@quiet/types'
import { SigChain } from '../../auth/sigchain'
import { SigChainService } from '../../auth/sigchain.service'
import { InviteService } from '../../auth/services/invites/invite.service'
import { UserService } from '../../auth/services/members/user.service'
import { Serializer } from '../../common/serializer.service'
import { LFAIdentityProvider } from '../orbitDb/identity/lfa/lfa-identity.provider'
import { LFAIdentities } from '../orbitDb/identity/lfa/lfa-identity.service'
import { StorageEvents } from '../storage.types'
import { ChannelStore } from './channel.store'
import { EncryptedMessage } from './messages/messages.types'
import { MessagesAccessController } from './messages/orbitdb/MessagesAccessController'
import { PrivateMessagesAccessController } from './messages/orbitdb/PrivateMessagesAccessController'
import { PublicChannelMessagesService } from './messages/public-channel-messages.service'
import { PrivateChannelMessagesService } from './messages/private-channel-messages.service'

// Real OrbitDB logs, LFA identities, access controllers and message consumers. Only block
// transport and unrelated profile/community storage are replaced with in-memory fixtures.
const serviceFor = (chain: SigChain): SigChainService => {
  const service = Object.assign(new EventEmitter(), {
    user: chain.user,
    team: chain.team!,
    activeChain: chain,
    activeTeamId: chain.team!.id,
    getActiveChain: () => chain,
    getChain: (id: string) => (id === chain.team!.id ? chain : undefined),
  })
  return service as unknown as SigChainService
}

const createTransport = () => {
  const blocks = new Map<string, Uint8Array>()
  const noop = () => {}
  return {
    blockstore: {
      put: async (cid: any, bytes: Uint8Array) => {
        blocks.set(cid.toString(), bytes)
      },
      get: async (cid: any) => blocks.get(cid.toString()),
    },
    pins: { isPinned: async () => false, add: async function* () {} },
    libp2p: {
      handle: noop,
      unhandle: noop,
      addEventListener: noop,
      removeEventListener: noop,
      services: {
        pubsub: {
          publish: noop,
          subscribe: noop,
          unsubscribe: noop,
          addEventListener: noop,
          removeEventListener: noop,
        },
      },
    },
  }
}

describe.each([true, false])('ChannelStore replicated %s-public channel history', isPublic => {
  it.each([false, true])('discovers a whole imported backlog; invalid ancestor = %s', async invalidAncestor => {
    const owner = SigChain.create()
    const invitation = owner.invites.createUserInvite()
    const context = UserService.createFromInviteSeed({ seed: invitation.seed })
    owner.invites.admitMemberFromInvite(InviteService.createMemberAdmission({ seed: invitation.seed, context }))
    const roleName = isPublic ? undefined : owner.channels.createWithMembers([context.user.userId])
    const member = SigChain.joinForTesting(context, owner.team!.save(), owner.team!.teamKeyring())
    const channel: PublicChannel = {
      id: 'replicated-channel',
      name: 'history',
      description: '',
      timestamp: 1,
      owner: owner.user.userId,
      teamId: owner.team!.id,
      public: isPublic,
      roleName,
    }
    const entryStorage = await MemoryStorage()
    const ipfs = createTransport()
    const createParty = async (chain: SigChain) => {
      const auth = serviceFor(chain)
      const serializer = new Serializer()
      const identities = new LFAIdentities(auth, new LFAIdentityProvider(serializer, auth), serializer)
      const identity = await identities.createIdentity({ id: chain.user.userId } as never)
      const publicAccess = new MessagesAccessController(auth)
      const privateAccess = new PrivateMessagesAccessController(auth)
      const factory = isPublic
        ? publicAccess.createAccessControllerFunc({
            write: ['*'],
            sigchainService: auth,
            channelId: channel.id,
            teamId: channel.teamId!,
          })
        : privateAccess.createAccessControllerFunc({
            write: ['*'],
            sigchainService: auth,
            channelId: channel.id,
            teamId: channel.teamId!,
            roleName: roleName!,
          })
      const access = await factory({ orbitdb: { ipfs, identity }, identities } as any)
      const db = (await Events()({
        ipfs,
        identity,
        address: 'replicated-channel-log',
        access,
        entryStorage,
        headsStorage: await MemoryStorage(),
        indexStorage: await MemoryStorage(),
        syncAutomatically: false,
      } as any)) as EventsType<EncryptedMessage>
      const publicMessages = new PublicChannelMessagesService(auth)
      const privateMessages = new PrivateChannelMessagesService(auth)
      const store = new ChannelStore(
        { open: async () => db } as any,
        { getCurrentCommunity: async () => ({ id: 'community' }) } as any,
        publicMessages,
        privateMessages,
        { getUsername: async () => 'owner' } as any,
        auth,
        publicAccess,
        privateAccess
      )
      await store.init(channel, { sync: false })
      return { db, store }
    }
    const sender = await createParty(owner)
    const receiver = await createParty(member)
    const append = async (id: string, invalid = false) => {
      const encrypted = await sender.store.messagesService.onSend(
        {
          id,
          message: id,
          type: MessageType.Basic,
          channelId: channel.id,
          userId: owner.user.userId,
          createdAt: 1,
        },
        channel
      )
      // The entry is signed by its real writer and passes log admission, but the encrypted
      // plaintext lies about authorship. The actual message consumer must still reject it.
      if (invalid) {
        const plaintext = {
          id,
          message: id,
          type: MessageType.Basic,
          channelId: channel.id,
          userId: member.user.userId,
          createdAt: 1,
          teamId: owner.team!.id,
        }
        const forged = owner.crypto.encryptAndSign(plaintext, encrypted.contents.scope)
        encrypted.contents = forged.encrypted
        encrypted.encSignature = forged.signature
      }
      const hash = await sender.db.add(encrypted)
      expect(hash).toBeDefined()
    }
    const importHead = async () => {
      const heads = await sender.db.log.heads()
      expect(heads).toHaveLength(1)
      await receiver.db.applyOperation(heads[0].bytes)
    }
    try {
      await append('already-seen')
      await importHead()
      await receiver.store.subscribe()

      const announced: string[] = []
      receiver.store.on(StorageEvents.MESSAGE_IDS_STORED, ({ ids }) => announced.push(...ids))
      // EventEmitter doesn't await async consumers. Wrap the real subscription so assertions
      // wait for processing instead of depending on a timer or a detached background promise.
      const pending: Promise<unknown>[] = []
      const handler = receiver.db.events.listeners('update')[0] as (...args: any[]) => Promise<void>
      receiver.db.events.removeListener('update', handler)
      receiver.db.events.on('update', entry => {
        pending.push(Promise.resolve(handler(entry)))
      })
      const updates = jest.fn()
      receiver.db.events.on('update', updates)

      await append('oldest-offline')
      await append('middle-offline', invalidAncestor)
      await append('newest-offline')
      await importHead()
      await Promise.all(pending)

      // This is the production QSS/head-exchange behavior the old mock missed: one update
      // imports three entries. A ready index must discover ancestors without a restart.
      expect(updates).toHaveBeenCalledTimes(1)
      expect(await receiver.db.all()).toHaveLength(4)
      const expected = ['oldest-offline', 'newest-offline']
      if (!invalidAncestor) expected.push('middle-offline')
      expect(new Set(announced)).toEqual(new Set(expected))
      for (const id of expected) {
        const result = await receiver.store.getMessages([id])
        expect(result?.isVerified).toBe(true)
        expect(result?.messages).toEqual([expect.objectContaining({ id, message: id, userId: owner.user.userId })])
      }
      if (invalidAncestor) expect((await receiver.store.getMessages(['middle-offline']))?.messages).toEqual([])
    } finally {
      await receiver.store.close()
      await sender.store.close()
    }
  })
})
