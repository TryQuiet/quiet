/**
 * End-to-end regression coverage for the message author impersonation vulnerability
 * (#125, CLIENT-002).
 *
 * A channel message names its author twice over: once inside the encrypted plaintext (`userId`) and
 * once in the encrypted-signature envelope (`encSignature.author`). Neither was tied to the OrbitDB
 * writer, so an ordinary member holding the channel key could publish a well-formed entry under her
 * own device and have every layer above attribute the message to somebody else.
 *
 * Mallory is that member here and Alice is her victim. Nothing about Mallory's entry is forged in
 * the OrbitDB sense: she signs it with her own real device key, so the writer chokepoint added for
 * #150 resolves her correctly and the entry is hers. The lie lives entirely inside the message.
 *
 * The lie has two shapes, caught in two different places, so both are asserted here:
 *
 *   - claiming Alice in `encSignature.author` as well. The access controller sees that without
 *     decrypting anything, so the entry never enters the log.
 *   - leaving `encSignature.author` honest and lying only in the encrypted plaintext. No access
 *     controller can read that, so the entry is admitted and the message service drops the message.
 *
 * Everything runs against a real LFA team with real device keys, through the production identity
 * provider and identity service, the production access controllers, the production message services
 * and the production `ChannelStore` fan-out. Nothing on the identity, crypto or validation path is
 * mocked, and the attacker's artifacts are built with the same production crypto a real client uses
 * to send a message.
 *
 * The client half of the chain lives in `packages/state-manager`: a message that arrives without
 * `verified === true` is refused entry to Redux (`messages.slice.test.ts`) and produces no download,
 * unread or channel-list effects (`transportVerification.test.ts`).
 */

import { afterAll, beforeAll, describe, expect, it } from '@jest/globals'
import EventEmitter from 'events'
import { Base58, LocalUserContext } from '@localfirst/auth'
import { Entry, type LogEntry } from '@orbitdb/core'
import { base58btc } from 'multiformats/bases/base58'
import * as uint8arrays from 'uint8arrays'
import {
  MessageType,
  type ConsumedChannelMessage,
  type MessagesLoadedPayload,
  type PublicChannel,
  type PushNotificationPayload,
} from '@quiet/types'

import { InviteService } from '../../../auth/services/invites/invite.service'
import { UserService } from '../../../auth/services/members/user.service'
import {
  EncryptedAndSignedPayload,
  EncryptionScope,
  EncryptionScopeType,
  Signature,
} from '../../../auth/services/crypto/types'
import { MEMBER_SCOPE, RoleName } from '../../../auth/services/roles/roles'
import { SigChain } from '../../../auth/sigchain'
import { SigChainService } from '../../../auth/sigchain.service'
import { createLogger } from '../../../common/logger'
import { Serializer } from '../../../common/serializer.service'
import { isEncryptedMessage } from '../../../validation/validators'
import { ChannelStore } from '../channel.store'
import { OrbitDbOp } from '../../orbitDb/orbitdb.types'
import { getVerifiedEntryWriter } from '../../orbitDb/identity/lfa/entry-writer'
import { LFAIdentityProvider } from '../../orbitDb/identity/lfa/lfa-identity.provider'
import { LFAIdentities } from '../../orbitDb/identity/lfa/lfa-identity.service'
import { LFAIdentity } from '../../orbitDb/identity/lfa/types'
import { StorageEvents } from '../../storage.types'
import { BaseMessagesService } from './base-messages.service'
import { EncryptableMessageComponents, EncryptedMessage } from './messages.types'
import { MessagesAccessController } from './orbitdb/MessagesAccessController'
import { PrivateMessagesAccessController } from './orbitdb/PrivateMessagesAccessController'
import { PrivateChannelMessagesService } from './private-channel-messages.service'
import { PublicChannelMessagesService } from './public-channel-messages.service'

const serializer = new Serializer()

const LOG_ID = 'author-impersonation-log'
const PUBLIC_CHANNEL_ID = 'public-channel-id'
const PRIVATE_CHANNEL_ID = 'private-channel-id'
const COMMUNITY_ID = 'community-id'
const CREATED_AT = 1234

const emptyAsyncIterable = async function* () {}

/**
 * The only mock on the crypto path's side: an in-memory stand-in for the IPFS blockstore that access
 * controller factories use to persist their ACL manifest. It has nothing to do with authorship.
 */
const createInMemoryIpfs = () => {
  const blocks = new Map<string, Uint8Array>()
  const cidKey = (cid: any): string => cid.toString(base58btc)

  return {
    blockstore: {
      put: async (cid: any, bytes: Uint8Array) => {
        blocks.set(cidKey(cid), bytes)
      },
      get: async (cid: any) => blocks.get(cidKey(cid)),
    },
    pins: {
      isPinned: async () => false,
      add: () => emptyAsyncIterable(),
    },
  }
}

/** A team member, with the production identity provider and identity service bound to their chain. */
interface Party {
  chain: SigChain
  sigchainService: SigChainService
  identities: LFAIdentities
  identity: LFAIdentity
  userId: string
}

/**
 * A `SigChainService` bound to one member's own chain. It is an `EventEmitter` because
 * `ChannelStore.subscribe` subscribes to chain updates on it.
 */
const sigchainServiceFor = (chain: SigChain): SigChainService => {
  const service: any = new EventEmitter()
  Object.defineProperties(service, {
    user: { get: () => chain.user },
    team: { get: () => chain.team },
    activeChain: { get: () => chain },
    activeTeamId: { get: () => chain.team!.id },
  })
  service.getActiveChain = () => chain
  service.getChain = (teamId: string, throwError = true) => {
    if (teamId !== chain.team!.id) {
      if (throwError) throw new Error(`No chain found for team ID ${teamId}`)
      return undefined
    }
    return chain
  }
  return service as SigChainService
}

const partyFor = async (chain: SigChain): Promise<Party> => {
  const sigchainService = sigchainServiceFor(chain)
  const provider = new LFAIdentityProvider(serializer, sigchainService)
  const identities = new LFAIdentities(sigchainService, provider, serializer)
  return {
    chain,
    sigchainService,
    identities,
    identity: await identities.createIdentity({ id: chain.user.userId } as never),
    userId: chain.user.userId,
  }
}

/** Admit a member without loading their chain yet, so roles granted afterwards land in their snapshot. */
const admitMember = (admin: SigChain): LocalUserContext => {
  const invite = admin.invites.createUserInvite()
  const context = UserService.createFromInviteSeed({ seed: invite.seed })
  admin.invites.admitMemberFromInvite(InviteService.createMemberAdmission({ seed: invite.seed, context }))
  return context
}

/** Load the admitted member's own chain, carrying every role they hold by now. */
const loadMemberChain = (admin: SigChain, context: LocalUserContext): SigChain =>
  SigChain.joinForTesting(context, admin.team!.save(), admin.team!.teamKeyring())

/** Sign a genuine OrbitDB entry with this party's real LFA device key, via OrbitDB's own `Entry`. */
const signEntry = async (signer: Party, message: EncryptedMessage): Promise<LogEntry<any>> =>
  (await Entry.create(signer.identity as never, LOG_ID, {
    op: OrbitDbOp.PUT,
    value: message,
  } as never)) as unknown as LogEntry<any>

const restoreEnv = (key: string, value: string | undefined): void => {
  if (value == null) {
    delete process.env[key]
  } else {
    process.env[key] = value
  }
}

/** Flip a byte of a real signature: same length, same encoding, valid for nobody. */
const unverifiableBytes = (signature: Base58): Base58 => {
  const bytes = uint8arrays.fromString(signature, 'base58btc')
  bytes[0] ^= 0xff
  return uint8arrays.toString(bytes, 'base58btc') as Base58
}

/** How the attacker fills in the signature field once she has relabelled its author as Alice. */
const FORGED_SIGNATURES: [string, 'reused' | 'unverifiable'][] = [
  ['her own signature relabelled as Alice', 'reused'],
  ['signature bytes that verify for nobody', 'unverifiable'],
]

interface ChannelCase {
  label: string
  controller: string
  channel: () => PublicChannel
  scope: () => EncryptionScope
  createAccess: () => Promise<any>
  service: () => BaseMessagesService
}

describe('Message author impersonation (#125, CLIENT-002)', () => {
  let alice: Party
  let mallory: Party
  let teamId: string
  let privateChannelRole: string
  /** Alice's real, current author metadata, which the attacker copies onto her own message. */
  let aliceAuthor: Signature['author']
  let publicChannel: PublicChannel
  let privateChannel: PublicChannel
  let publicMessagesService: PublicChannelMessagesService
  let privateMessagesService: PrivateChannelMessagesService

  const originalBackend = process.env.BACKEND
  const originalConnectionTime = process.env.CONNECTION_TIME

  beforeAll(async () => {
    // Alice founds the team. Mallory joins as an ordinary member and is added to a private channel,
    // so she legitimately holds the public `member` key and the private channel role key. The attack
    // needs nothing beyond an ordinary member's own credentials.
    const aliceChain = SigChain.create()
    const malloryContext = admitMember(aliceChain)
    privateChannelRole = aliceChain.channels.createWithMembers([malloryContext.user.userId])
    const malloryChain = loadMemberChain(aliceChain, malloryContext)

    alice = await partyFor(aliceChain)
    mallory = await partyFor(malloryChain)
    teamId = aliceChain.team!.id
    aliceAuthor = aliceChain.crypto.sign({ probe: true }).author

    publicChannel = {
      id: PUBLIC_CHANNEL_ID,
      name: 'general',
      description: 'a public channel',
      owner: alice.userId,
      timestamp: 1,
      public: true,
      teamId,
    }
    privateChannel = {
      id: PRIVATE_CHANNEL_ID,
      name: 'secrets',
      description: 'a private channel',
      owner: alice.userId,
      timestamp: 1,
      public: false,
      teamId,
      roleName: privateChannelRole,
    }

    // Alice is the one consuming, so the services run against her chain.
    publicMessagesService = new PublicChannelMessagesService(alice.sigchainService)
    privateMessagesService = new PrivateChannelMessagesService(alice.sigchainService)

    // Put the store on the branch that raises mobile push notifications, so their absence for an
    // impersonated message is asserted rather than assumed.
    process.env.BACKEND = 'mobile'
    process.env.CONNECTION_TIME = '0'
  })

  afterAll(() => {
    restoreEnv('BACKEND', originalBackend)
    restoreEnv('CONNECTION_TIME', originalConnectionTime)
  })

  // Message construction. Every message below is built with the production crypto path, the same one
  // `onSend` uses, so the attacker's artifact differs from an honest one only in who it names.

  const plaintextOf = (id: string, authorId: string, channelId: string): EncryptableMessageComponents => ({
    id,
    userId: authorId,
    type: MessageType.Basic,
    channelId,
    message: 'hello',
    teamId,
    createdAt: CREATED_AT,
  })

  const wrap = (
    id: string,
    channelId: string,
    encrypted: EncryptedAndSignedPayload,
    encSignature: Signature
  ): EncryptedMessage => ({
    id,
    channelId,
    createdAt: CREATED_AT,
    teamId,
    contents: encrypted.encrypted,
    encSignature,
  })

  /** A normal message: the writer, the encrypted-signature author and the plaintext all agree. */
  const honestMessage = (
    signer: Party,
    id: string,
    channel: PublicChannel,
    scope: EncryptionScope
  ): EncryptedMessage => {
    const encrypted = signer.chain.crypto.encryptAndSign(plaintextOf(id, signer.userId, channel.id), scope)
    return wrap(id, channel.id, encrypted, encrypted.signature)
  }

  /**
   * The whole attack: Mallory encrypts to the channel key with her own keys, then names Alice in
   * both places a reader could look. The signature keeps the length and encoding of a real LFA
   * signature, so only an actual verification tells it apart from Alice's.
   */
  const authorImpersonation = (
    id: string,
    channel: PublicChannel,
    scope: EncryptionScope,
    forged: 'reused' | 'unverifiable'
  ): EncryptedMessage => {
    const encrypted = mallory.chain.crypto.encryptAndSign(plaintextOf(id, alice.userId, channel.id), scope)
    const signature =
      forged === 'reused' ? encrypted.signature.signature : unverifiableBytes(encrypted.signature.signature)
    return wrap(id, channel.id, encrypted, { author: { ...aliceAuthor }, signature })
  }

  /**
   * The half of the attack no access controller can catch: the encrypted-signature author honestly
   * names Mallory and its bytes verify, and only the encrypted plaintext claims Alice. The entry is
   * admitted to the log; the message service is what refuses the message.
   */
  const plaintextImpersonation = (id: string, channel: PublicChannel, scope: EncryptionScope): EncryptedMessage => {
    const encrypted = mallory.chain.crypto.encryptAndSign(plaintextOf(id, alice.userId, channel.id), scope)
    return wrap(id, channel.id, encrypted, encrypted.signature)
  }

  /**
   * The message resolution the fix replaced, reconstructed so the artifacts above are shown to be a
   * working attack rather than merely malformed data. The old services cleared `throwOnInvalid` and
   * carried a failed signature check through as a `verified: false` flag, and the old
   * `validateMessage` never looked at that flag.
   */
  const legacyConsume = (encryptedMessage: EncryptedMessage): ConsumedChannelMessage => {
    const decrypted = alice.chain.crypto.decryptAndVerify<EncryptableMessageComponents>(
      encryptedMessage.contents,
      encryptedMessage.encSignature,
      false
    )
    return { ...decrypted.contents, encSignature: encryptedMessage.encSignature, verified: decrypted.isValid }
  }

  const publicAccessController = async () => {
    const controller = new MessagesAccessController(alice.sigchainService)
    const factory = controller.createAccessControllerFunc({
      write: ['*'],
      sigchainService: alice.sigchainService,
      channelId: PUBLIC_CHANNEL_ID,
      teamId,
    })
    return (factory as any)({
      orbitdb: { identity: { id: alice.userId }, ipfs: createInMemoryIpfs() },
      identities: alice.identities,
    })
  }

  const privateAccessController = async () => {
    const controller = new PrivateMessagesAccessController(alice.sigchainService)
    const factory = controller.createAccessControllerFunc({
      write: ['*'],
      sigchainService: alice.sigchainService,
      channelId: PRIVATE_CHANNEL_ID,
      teamId,
      roleName: privateChannelRole,
    })
    return (factory as any)({
      orbitdb: { identity: { id: alice.userId }, ipfs: createInMemoryIpfs() },
      identities: alice.identities,
    })
  }

  /**
   * Drive the production `ChannelStore` update handler over a fake OrbitDB store, the way
   * `channel.store.spec.ts` does. Everything past `onConsume` is the real thing, and these are the
   * events that leave the backend: `MESSAGES_STORED` carries a message over the socket into Redux,
   * `MESSAGE_IDS_STORED` tells the client which messages exist, and `SEND_PUSH_NOTIFICATION` raises
   * a mobile notification.
   */
  const fanOut = async (
    channel: PublicChannel,
    messagesService: BaseMessagesService,
    entries: EncryptedMessage[]
  ): Promise<{ stored: MessagesLoadedPayload[]; notified: PushNotificationPayload[]; ids: string[] }> => {
    const storeEvents = new EventEmitter()
    const replicated: EncryptedMessage[] = []
    const channelStore = new ChannelStore(
      {} as never,
      { getCurrentCommunity: async () => ({ id: COMMUNITY_ID }) } as never,
      {} as never,
      {} as never,
      { getUsername: async () => undefined } as never,
      alice.sigchainService,
      {} as never,
      {} as never
    )
    ;(channelStore as any).channelData = channel
    ;(channelStore as any).logger = createLogger('author-impersonation:channelStore')
    ;(channelStore as any)._messagesService = messagesService
    ;(channelStore as any).store = {
      events: storeEvents,
      sync: { start: async () => {} },
      iterator: async function* () {
        for (const value of replicated) {
          yield { hash: value.id, value }
        }
      },
    }

    const stored: MessagesLoadedPayload[] = []
    const notified: PushNotificationPayload[] = []
    let ids: string[] = []
    channelStore.on(StorageEvents.MESSAGES_STORED, payload => stored.push(payload))
    channelStore.on(StorageEvents.SEND_PUSH_NOTIFICATION, payload => notified.push(payload))
    channelStore.on(StorageEvents.MESSAGE_IDS_STORED, payload => {
      ids = payload.ids
    })

    await channelStore.subscribe()
    stored.length = 0
    notified.length = 0

    for (const entry of entries) {
      // The access controller has already run by the time OrbitDB reports an update, so an entry
      // reaching here is one the log accepted.
      replicated.push(entry)
      const settled = new Promise<void>(resolve => channelStore.once(StorageEvents.MESSAGE_IDS_STORED, () => resolve()))
      storeEvents.emit('update', { hash: entry.id, payload: { value: entry } })
      await settled
    }

    return { stored, notified, ids }
  }

  it('builds a team where Mallory is an ordinary member holding the channel keys', () => {
    const chain = alice.chain
    expect(chain.roles.memberHasRole(mallory.userId, RoleName.MEMBER)).toBe(true)
    expect(chain.roles.memberIsAdmin(mallory.userId)).toBe(false)
    expect(chain.channels.memberInChannel(mallory.userId, privateChannelRole)).toBe(true)
    expect(chain.channels.memberInChannel(alice.userId, privateChannelRole)).toBe(true)
    expect(mallory.userId).not.toEqual(alice.userId)
    expect(aliceAuthor.name).toEqual(alice.userId)
    expect(aliceAuthor.type).toEqual(EncryptionScopeType.USER)
  })

  const impersonationSuite = ({ label, controller, channel, scope, createAccess, service }: ChannelCase): void => {
    describe(label, () => {
      describe(controller, () => {
        it('accepts honest messages from Mallory and from Alice', async () => {
          const access = await createAccess()

          await expect(
            access.canAppend(await signEntry(mallory, honestMessage(mallory, 'honest-mallory', channel(), scope())))
          ).resolves.toBe(true)
          await expect(
            access.canAppend(await signEntry(alice, honestMessage(alice, 'honest-alice', channel(), scope())))
          ).resolves.toBe(true)
        })

        it.each(FORGED_SIGNATURES)(
          'rejects a message Mallory writes as herself while claiming Alice, using %s',
          async (_name, forged) => {
            const access = await createAccess()
            const entry = await signEntry(mallory, authorImpersonation('impersonation', channel(), scope(), forged))

            // The writer is genuinely Mallory: the entry is hers, signed by her real device, and the
            // #150 chokepoint resolves it. Only the author binding stands between her and Alice.
            await expect(access.canAppend(entry)).resolves.toBe(false)
          }
        )

        it('rejects the impersonation over ciphertext an honest entry is accepted with', async () => {
          // Both entries carry byte-for-byte the same ciphertext and the same signature, written by
          // Mallory under her own identity. They differ in `encSignature.author` and nothing else,
          // so the rejection can only be the author binding.
          const access = await createAccess()
          const encrypted = mallory.chain.crypto.encryptAndSign(
            plaintextOf('shared-ciphertext', alice.userId, channel().id),
            scope()
          )
          const honestlyAuthored = wrap('shared-ciphertext', channel().id, encrypted, encrypted.signature)
          const impersonating = wrap('shared-ciphertext', channel().id, encrypted, {
            author: { ...aliceAuthor },
            signature: encrypted.signature.signature,
          })

          await expect(access.canAppend(await signEntry(mallory, honestlyAuthored))).resolves.toBe(true)
          await expect(access.canAppend(await signEntry(mallory, impersonating))).resolves.toBe(false)
        })
      })

      describe('message service', () => {
        it('consumes honest messages from either member as verified', async () => {
          await expect(
            service().onConsume(honestMessage(mallory, 'consumed-mallory', channel(), scope()), channel())
          ).resolves.toEqual(
            expect.objectContaining({ id: 'consumed-mallory', userId: mallory.userId, verified: true })
          )
          await expect(
            service().onConsume(honestMessage(alice, 'consumed-alice', channel(), scope()), channel())
          ).resolves.toEqual(expect.objectContaining({ id: 'consumed-alice', userId: alice.userId, verified: true }))
        })

        it.each(FORGED_SIGNATURES)(
          'consumes nothing when Mallory claims Alice as the author, using %s',
          async (_name, forged) => {
            const message = authorImpersonation('service-impersonation', channel(), scope(), forged)

            await expect(service().onConsume(message, channel())).resolves.toBeUndefined()
          }
        )

        it('consumes nothing when only the encrypted plaintext claims Alice', async () => {
          // This message is admitted by the access controller, which cannot read the plaintext. The
          // service decrypts it, finds the plaintext author disagreeing with the signed one, and
          // drops it, so the message never becomes a consumed message.
          const message = plaintextImpersonation('service-plaintext-impersonation', channel(), scope())

          await expect(service().onConsume(message, channel())).resolves.toBeUndefined()
        })
      })

      describe('ChannelStore fan-out', () => {
        it('emits an honest message to the client and notifies for it', async () => {
          const message = honestMessage(mallory, 'fanout-honest', channel(), scope())

          const { stored, notified, ids } = await fanOut(channel(), service(), [message])

          expect(stored).toEqual([
            { messages: [expect.objectContaining({ id: 'fanout-honest', userId: mallory.userId })], isVerified: true },
          ])
          expect(notified).toHaveLength(1)
          expect(ids).toEqual(['fanout-honest'])
        })

        it.each(FORGED_SIGNATURES)(
          'emits no message, no message id and no notification for an impersonation using %s',
          async (_name, forged) => {
            const message = authorImpersonation('fanout-impersonation', channel(), scope(), forged)

            const { stored, notified, ids } = await fanOut(channel(), service(), [message])

            expect(stored).toEqual([])
            expect(notified).toEqual([])
            expect(ids).toEqual([])
          }
        )

        it('emits no message, no message id and no notification when only the plaintext claims Alice', async () => {
          const message = plaintextImpersonation('fanout-plaintext-impersonation', channel(), scope())

          const { stored, notified, ids } = await fanOut(channel(), service(), [message])

          expect(stored).toEqual([])
          expect(notified).toEqual([])
          expect(ids).toEqual([])
        })

        it('drops the impersonation from a batch that also carries an honest message', async () => {
          const honest = honestMessage(mallory, 'fanout-mixed-honest', channel(), scope())
          const impersonating = authorImpersonation('fanout-mixed-impersonation', channel(), scope(), 'reused')

          const { stored, notified, ids } = await fanOut(channel(), service(), [impersonating, honest])

          expect(stored).toEqual([
            {
              messages: [expect.objectContaining({ id: 'fanout-mixed-honest', userId: mallory.userId })],
              isVerified: true,
            },
          ])
          expect(notified).toHaveLength(1)
          expect(ids).toEqual(['fanout-mixed-honest'])
        })
      })

      // The same artifacts measured against the behaviour the fix replaced. Without this the tests
      // above could pass over data that was simply malformed, rather than over a live attack.
      describe('before the fix', () => {
        it('was an entry Mallory was entitled to write, carrying a well formed message', async () => {
          // Writer resolution is #150's chokepoint and is untouched by this fix: it names Mallory,
          // correctly, because she really did sign the entry with her own device. The old controller
          // then checked the write list and the message shape and stopped, so nothing it could see
          // distinguished this entry from one Mallory was entitled to publish, which she was.
          const message = authorImpersonation('legacy-entry', channel(), scope(), 'reused')
          const entry = await signEntry(mallory, message)

          await expect(getVerifiedEntryWriter(alice.identities as never, entry)).resolves.toMatchObject({
            id: mallory.userId,
          })
          expect(isEncryptedMessage(message)).toBe(true)
        })

        it.each(FORGED_SIGNATURES)('decrypted to a message attributed to Alice, using %s', (_name, forged) => {
          const message = authorImpersonation('legacy-consume', channel(), scope(), forged)

          expect(legacyConsume(message)).toEqual(
            expect.objectContaining({ userId: alice.userId, verified: false, message: 'hello' })
          )
        })

        it('is refused by validateMessage only because the signature did not verify', () => {
          // Every other field of the impersonated message is self-consistent, which is why ignoring
          // the verification result was enough to show Mallory's message as Alice's.
          const message = authorImpersonation('legacy-validate', channel(), scope(), 'reused')
          const decrypted = legacyConsume(message)

          expect(service().validateMessage(decrypted, message, channel())).toBe(false)
          expect(service().validateMessage({ ...decrypted, verified: true }, message, channel())).toBe(true)
        })
      })
    })
  }

  impersonationSuite({
    label: 'public channel',
    controller: 'MessagesAccessController',
    channel: () => publicChannel,
    scope: () => MEMBER_SCOPE,
    createAccess: () => publicAccessController(),
    service: () => publicMessagesService,
  })

  impersonationSuite({
    label: 'private channel',
    controller: 'PrivateMessagesAccessController',
    channel: () => privateChannel,
    scope: () => ({ type: EncryptionScopeType.ROLE, name: privateChannelRole }),
    createAccess: () => privateAccessController(),
    service: () => privateMessagesService,
  })

  /**
   * `ChannelStore.init` used to derive the access controller's team as
   * `channelData.teamId ?? this.auth.team.id`, preferring the channel metadata. That metadata is
   * replicated, so for every channel this node learns about rather than creates, a peer chooses the
   * value. An attacker could publish channel metadata naming any team and then send messages stamped
   * with that same id, leaving `encryptedMessage.teamId !== config.teamId` comparing two values they
   * supplied. The team a message is authorized against has to come from the local chain.
   */
  describe('access controller team binding', () => {
    const FOREIGN_TEAM_ID = 'foreign-team-id'

    /** Init the production store over a channel whose replicated metadata names a foreign team. */
    const configFromForeignMetadata = async (channel: PublicChannel): Promise<{ teamId: string }> => {
      const recorded: { teamId: string }[] = []
      const recorder = {
        createAccessControllerFunc: (config: { teamId: string }) => {
          recorded.push(config)
          const accessController: any = () => ({})
          accessController.type = 'author-impersonation-test-access'
          return accessController
        },
      }
      const store = new ChannelStore(
        { open: async () => ({ events: new EventEmitter(), sync: { start: async () => {} } }) } as never,
        {} as never,
        {} as never,
        {} as never,
        {} as never,
        alice.sigchainService,
        recorder as never,
        recorder as never
      )

      await store.init({ ...channel, teamId: FOREIGN_TEAM_ID }, { sync: false })
      expect(recorded).toHaveLength(1)
      return recorded[0]
    }

    it.each([
      ['public channel', () => publicChannel],
      ['private channel', () => privateChannel],
    ])('binds a %s to the local sigchain team, not to the replicated channel metadata', async (_label, channel) => {
      const config = await configFromForeignMetadata(channel())

      expect(config.teamId).toEqual(teamId)
      expect(config.teamId).not.toEqual(FOREIGN_TEAM_ID)
    })
  })
})
