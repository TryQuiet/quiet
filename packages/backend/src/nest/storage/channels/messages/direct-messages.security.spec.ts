import EventEmitter from 'events'
import { Entry, type LogEntry } from '@orbitdb/core'
import { MessageType, type ChannelMessage, type MessagesLoadedPayload } from '@quiet/types'
import { dmFixture, dmMessage } from '../../../auth/services/crypto/direct-message-test-utils'
import { SigChain } from '../../../auth/sigchain'
import { SigChainService } from '../../../auth/sigchain.service'
import { Serializer } from '../../../common/serializer.service'
import { createLogger } from '../../../common/logger'
import { LFAIdentityProvider } from '../../orbitDb/identity/lfa/lfa-identity.provider'
import { LFAIdentities } from '../../orbitDb/identity/lfa/lfa-identity.service'
import { OrbitDbOp } from '../../orbitDb/orbitdb.types'
import { ChannelMetadataAccessController } from '../orbitdb/ChannelMetadataAccessController'
import { PrivateMessagesAccessController } from './orbitdb/PrivateMessagesAccessController'
import { DirectMessagesService } from './direct-messages.service'
import { ChannelStore } from '../channel.store'
import { StorageEvents } from '../../storage.types'
import type { EncryptedMessage } from './messages.types'

const serviceFor = (chain: SigChain): SigChainService => {
  const service = Object.assign(new EventEmitter(), {
    team: chain.team,
    user: chain.user,
    activeChain: chain,
    activeTeamId: chain.team!.id,
    getActiveChain: () => chain,
    getChain: (teamId: string) => (teamId === chain.team!.id ? chain : undefined),
  })
  return service as unknown as SigChainService
}
const partyFor = async (chain: SigChain) => {
  const service = serviceFor(chain)
  const serializer = new Serializer()
  const identities = new LFAIdentities(service, new LFAIdentityProvider(serializer, service), serializer)
  const identity = await identities.createIdentity({ id: chain.user.userId } as never)
  return { chain, service, identities, identity }
}

describe('DM trust boundaries and application effects', () => {
  let fixture: ReturnType<typeof dmFixture>
  let bob: Awaited<ReturnType<typeof partyFor>>
  let carol: Awaited<ReturnType<typeof partyFor>>
  let admin: Awaited<ReturnType<typeof partyFor>>
  let messages: DirectMessagesService
  let canAppend: (entry: LogEntry) => Promise<boolean>
  let entryClock = 0
  const sign = async (party: typeof bob, payload: unknown) =>
    (await Entry.create(
      party.identity as never,
      'secure-dm-log',
      payload as never,
      { id: party.identity.publicKey, time: ++entryClock } as never
    )) as unknown as LogEntry

  beforeAll(async () => {
    fixture = dmFixture()
    bob = await partyFor(fixture.bob)
    carol = await partyFor(fixture.carol)
    admin = await partyFor(fixture.admin)
    messages = new DirectMessagesService(carol.service)
    canAppend = (new PrivateMessagesAccessController(carol.service) as any).canAppend(
      {
        write: fixture.channel.memberIds,
        channelId: fixture.channel.id,
        teamId: fixture.carol.team!.id,
        sigchainService: carol.service,
        roleName: '',
        directMessage: true,
      },
      carol.identities
    )
  })

  it('accepts an honest OrbitDB device writer and rejects relabeling, outsider forwarding and ciphertext mutation', async () => {
    const encrypted = fixture.bob.directMessages.sealMessage(
      dmMessage(fixture.bob, fixture.channel),
      fixture.channel.id
    )
    const honest = await sign(bob, { op: 'ADD', value: encrypted })
    expect(await canAppend(honest)).toBe(true)
    expect(await messages.onConsume(encrypted, fixture.channel)).toMatchObject({
      verified: true,
      userId: bob.chain.user.userId,
    })
    for (const forwarder of [carol, admin]) {
      expect(await canAppend(await sign(forwarder, { op: 'ADD', value: encrypted }))).toBe(false)
    }
    const relabeled = { ...honest, identity: carol.identity.hash, key: carol.identity.publicKey }
    expect(await canAppend(relabeled)).toBe(false)
    const altered = structuredClone(encrypted)
    altered.contents.contents[5] ^= 1
    expect(await canAppend(await sign(bob, { op: 'ADD', value: altered }))).toBe(false)
    expect(await messages.onConsume(altered, fixture.channel)).toBeUndefined()
  })

  it('preserves signed descriptors and messages through JSON replication without weakening authentication', async () => {
    // Metadata indexing/JSON relays turn a cloned Uint8Array into a numeric-key object.
    const descriptor = JSON.parse(JSON.stringify(fixture.bob.directMessages.descriptor(fixture.channel.id)))
    expect(fixture.carol.directMessages.openDescriptor(descriptor, fixture.channel.id)).toEqual(fixture.channel)
    const original = fixture.bob.directMessages.sealMessage(dmMessage(fixture.bob, fixture.channel), fixture.channel.id)
    const encrypted = JSON.parse(JSON.stringify(original))
    expect(await canAppend(await sign(bob, { op: 'ADD', value: encrypted }))).toBe(true)
    expect(await messages.onConsume(encrypted, fixture.channel)).toMatchObject({ id: original.id, verified: true })
    encrypted.contents.contents[0] = (encrypted.contents.contents[0] + 1) % 256
    expect(await canAppend(await sign(bob, { op: 'ADD', value: encrypted }))).toBe(false)
    expect(await messages.onConsume(encrypted, fixture.channel)).toBeUndefined()
  })

  it('accepts only creator-bound immutable DM metadata, including on an admin replica without the DM key', async () => {
    const history: LogEntry[] = []
    const metadataCheck = (new ChannelMetadataAccessController(admin.service) as any).canAppend(
      {
        write: ['*'],
        isPublic: false,
        isDirectMessage: true,
        sigchainService: admin.service,
      },
      admin.identities,
      () => ({
        traverse: async function* () {
          yield* history
        },
      })
    )
    const payload = { op: OrbitDbOp.PUT, key: fixture.channel.id, value: fixture.descriptor }
    const honest = await sign(bob, payload)
    expect(await metadataCheck(honest)).toBe(true)
    expect(await metadataCheck(await sign(admin, payload))).toBe(false)
    expect(await metadataCheck(await sign(bob, { ...payload, key: 'different-database-key' }))).toBe(false)
    expect(await metadataCheck(await sign(bob, { op: OrbitDbOp.DEL, key: fixture.channel.id }))).toBe(false)
    history.push(honest)
    expect(await metadataCheck(await sign(bob, payload))).toBe(false)
    expect(admin.chain.directMessages.has(fixture.channel.id)).toBe(false)
  })

  it('rejects participant-signed attachment redirection before accepting an OrbitDB entry or consuming the message', async () => {
    const plain = dmMessage(fixture.bob, fixture.channel)
    const attachment: ChannelMessage = {
      ...plain,
      type: MessageType.File,
      message: '',
      media: {
        name: 'confidential',
        ext: '.txt',
        path: null,
        size: 64,
        cid: 'bafkreigh2akiscaildcq2khwjeahntt3k6wk7gi2tqe7ms43hypsj7hazu',
        message: { id: plain.id, channelId: fixture.channel.id },
        enc: {
          header: Buffer.alloc(24, 1).toString('base64url'),
          recipient: { type: 'DM', name: fixture.channel.id, generation: 0 },
        },
      },
    }
    const seal = (message: ChannelMessage) => fixture.bob.directMessages.sealMessage(message, fixture.channel.id)
    const honest = seal(attachment)
    expect(await canAppend(await sign(bob, { op: 'ADD', value: honest }))).toBe(true)
    expect(await messages.onConsume(honest, fixture.channel)).toBeDefined()
    const attacks: Array<(message: ChannelMessage) => void> = [
      message => {
        message.media!.message.id = `${fixture.carol.user.userId}:victim`
      },
      message => {
        message.media!.message.channelId = 'general'
      },
      message => {
        message.media!.enc!.recipient.type = 'ROLE'
      },
      message => {
        message.media!.enc!.recipient.name = 'MEMBER'
      },
      message => {
        message.media!.enc!.recipient.generation = 1
      },
      message => {
        message.media!.path = '/tmp/victim'
      },
      message => {
        message.media!.tmpPath = '/tmp/victim'
      },
    ]
    for (const mutate of attacks) {
      const attack = structuredClone(attachment)
      mutate(attack)
      // A participant can create a valid signature over malicious metadata. Receiver checks must still reject it.
      const encrypted = seal(attack)
      expect(await canAppend(await sign(bob, { op: 'ADD', value: encrypted }))).toBe(false)
      expect(await messages.onConsume(encrypted, fixture.channel)).toBeUndefined()
    }
  })

  it('drops failed authentication before message/unread/notification fan-out and suppresses duplicate delivery across reload', async () => {
    const originalBackend = process.env.BACKEND
    const originalConnectionTime = process.env.CONNECTION_TIME
    process.env.BACKEND = 'mobile'
    process.env.CONNECTION_TIME = '0'
    const encrypted = fixture.bob.directMessages.sealMessage(
      dmMessage(fixture.bob, fixture.channel),
      fixture.channel.id
    )
    const history: EncryptedMessage[] = []
    const fanout: ChannelMessage[] = []
    const notifications: unknown[] = []
    const ids: string[][] = []
    const subscribe = async () => {
      const storeEvents = new EventEmitter()
      const store = new ChannelStore(
        {} as never,
        { getCurrentCommunity: async () => ({ id: 'community' }) } as never,
        {} as never,
        {} as never,
        messages,
        { getUsername: async () => 'Bob' } as never,
        carol.service,
        {} as never,
        {} as never
      )
      Object.assign(store, {
        channelData: fixture.channel,
        logger: createLogger('dm-fanout'),
        _messagesService: messages,
        store: {
          events: storeEvents,
          sync: { start: async () => {} },
          iterator: async function* () {
            for (const value of history) yield { value }
          },
        },
      })
      store.on(StorageEvents.MESSAGES_STORED, (payload: MessagesLoadedPayload) => fanout.push(...payload.messages))
      store.on(StorageEvents.SEND_PUSH_NOTIFICATION, payload => notifications.push(payload))
      store.on(StorageEvents.MESSAGE_IDS_STORED, payload => ids.push(payload.ids))
      await store.subscribe()
      return {
        store,
        deliver: async (value: EncryptedMessage) => {
          history.push(value)
          // Await the real asynchronous OrbitDB update listener rather than a timer.
          for (const listener of storeEvents.listeners('update')) await listener({ hash: 'entry', payload: { value } })
        },
      }
    }
    try {
      const first = await subscribe()
      const forged = structuredClone(encrypted)
      forged.createdAt += 1
      await first.deliver(forged)
      expect(fanout).toEqual([])
      expect(notifications).toEqual([])
      expect(ids.every(value => value.length === 0)).toBe(true)
      await first.deliver(encrypted)
      await first.deliver(encrypted)
      expect(fanout.map(message => message.id)).toEqual([encrypted.id])
      expect(notifications).toHaveLength(1)
      expect(ids[ids.length - 1]).toEqual([encrypted.id])
      const reloaded = await subscribe()
      await reloaded.deliver(encrypted)
      expect(fanout).toHaveLength(1)
      expect(notifications).toHaveLength(1)
      expect((await reloaded.store.getEntries()).map(message => message.id)).toEqual([encrypted.id])
    } finally {
      if (originalBackend == null) delete process.env.BACKEND
      else process.env.BACKEND = originalBackend
      if (originalConnectionTime == null) delete process.env.CONNECTION_TIME
      else process.env.CONNECTION_TIME = originalConnectionTime
    }
  })
})
