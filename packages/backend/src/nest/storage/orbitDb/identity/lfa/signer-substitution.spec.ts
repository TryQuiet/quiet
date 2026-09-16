/**
 * End-to-end regression coverage for the signer-substitution vulnerability (#150, CLIENT-001).
 *
 * An OrbitDB entry carries the writer identity (`entry.identity`) and the signing key (`entry.key`)
 * in two separate fields, and neither is covered by the entry signature. Before the fix, an ordinary
 * member could sign an entry with their own valid LFA key while the identity bytes named an admin,
 * and Quiet would authorize the operation as the admin.
 *
 * These tests build that attack the way a real attacker would: a genuine entry signed by Bob's
 * device through OrbitDB's own `Entry.create`, re-encoded with the identity and/or key fields
 * rewritten to name someone else. Everything runs against a real LFA team with real device keys,
 * through the production identity provider and identity service and the production access
 * controllers and validators. Nothing on the identity or signature path is mocked.
 *
 * `getVerifiedEntryWriter` authenticates the signature as well as the writer fields, so each access
 * controller rejects every substitution on its own. That is asserted directly for the executed proof
 * of concept, and once end to end through a real `Log.joinEntry`.
 */

import { beforeAll, describe, expect, it } from '@jest/globals'
import * as dagCbor from '@ipld/dag-cbor'
import { signatures } from '@localfirst/auth'
import { Entry, Log, MemoryStorage, type LogEntry } from '@orbitdb/core'
import { base58btc } from 'multiformats/bases/base58'
import * as Block from 'multiformats/block'
import { sha256 } from 'multiformats/hashes/sha2'
import { SerializerEncodingType, UserProfile } from '@quiet/types'
import * as uint8arrays from 'uint8arrays'

import { InviteService } from '../../../../auth/services/invites/invite.service'
import { UserService } from '../../../../auth/services/members/user.service'
import { EncryptedAndSignedPayload, EncryptionScopeType } from '../../../../auth/services/crypto/types'
import { MEMBER_SCOPE, RoleName } from '../../../../auth/services/roles/roles'
import { SigChain } from '../../../../auth/sigchain'
import { SigChainService } from '../../../../auth/sigchain.service'
import { Serializer } from '../../../../common/serializer.service'
import { ChannelsService } from '../../../channels/channels.service'
import { EncryptedMessage } from '../../../channels/messages/messages.types'
import { MessagesAccessController } from '../../../channels/messages/orbitdb/MessagesAccessController'
import { PrivateMessagesAccessController } from '../../../channels/messages/orbitdb/PrivateMessagesAccessController'
import { ChannelMetadataAccessController } from '../../../channels/orbitdb/ChannelMetadataAccessController'
import { CommunityMetadataStore } from '../../../communityMetadata/communityMetadata.store'
import { UserProfileAccessController } from '../../../userProfile/UserProfileAccessController'
import { OrbitDbOp } from '../../orbitdb.types'
import { LFA_ORBITDB_ENTRY_SIGNATURE_CONTEXT } from './const'
import { getVerifiedEntryWriter } from './entry-writer'
import { LFAIdentityProvider } from './lfa-identity.provider'
import { LFAIdentities } from './lfa-identity.service'
import { LFAIdentity, LFAIdentityMetadata, SignatureWithTeamId } from './types'

const serializer = new Serializer()

const LOG_ID = 'signer-substitution-log'
const PUBLIC_CHANNEL_ID = 'public-channel-id'
const PRIVATE_CHANNEL_ID = 'private-channel-id'
const COMMUNITY_ID = 'community-metadata-id'

/** Valid, mutually consistent certificates, reused from `communityMetadata.store.spec.ts`. */
const COMMUNITY_CERTS = {
  rootCa:
    'MIIBaDCCAQ6gAwIBAgIBATAKBggqhkjOPQQDAjAZMRcwFQYDVQQDEw5xdWlldGNvbW11bml0eTAmGBMyMDI0MTAwNDE1NDY1My40ODNaGA8yMDMwMDIwMTA1MDAwMFowGTEXMBUGA1UEAxMOcXVpZXRjb21tdW5pdHkwWTATBgcqhkjOPQIBBggqhkjOPQMBBwNCAAR6hYpugDRODiuS3X83876ygKhivtCqZO/OnjTyGgNIfzhsG0TQjV/uVpM8okPMJxRXmANJIgjj0d2kifiICCntoz8wPTAPBgNVHRMECDAGAQH/AgEDMAsGA1UdDwQEAwIAhjAdBgNVHSUEFjAUBggrBgEFBQcDAgYIKwYBBQUHAwEwCgYIKoZIzj0EAwIDSAAwRQIgPjAmthGNzefL5oVPS0735LgCt/3ECJxaCb+STDkV7MACIQCC/BSxvR/heL2eFlFjd7o8+CrKuX9g4Ez9E+WtYRYwvA==',
  ownerCertificate:
    'MIICOjCCAeGgAwIBAgIGAZJYNmuzMAoGCCqGSM49BAMCMBkxFzAVBgNVBAMTDnF1aWV0Y29tbXVuaXR5MB4XDTI0MTAwNDE1NDY1M1oXDTMwMDIwMTA1MDAwMFowSTFHMEUGA1UEAxM+bnFudzRrYzRjNzdmYjQ3bGs1Mm01bDU3aDR0Y3hjZW83eW14ZWtmbjd5aDVtNjZ0NGp2Mm9sYWQub25pb24wWTATBgcqhkjOPQIBBggqhkjOPQMBBwNCAAQL8e+VoMUh0oiSewbKQ0dNwEVObX5BWPQ2L04NZX5HPZRj9rL/CBa2FTogNeyTbtG7VqTfEWWOWjnj/xVaYOF6o4HkMIHhMAkGA1UdEwQCMAAwCwYDVR0PBAQDAgCAMB0GA1UdJQQWMBQGCCsGAQUFBwMCBggrBgEFBQcDATAYBgorBgEEAYOMGwIBBAoTCHVzZXJOYW1lMEMGCSsGAQIBDwMBAQQ2EzQxMkQzS29vV0tDV3N0bXFpNWdhUXZpcFQ3eFZuZVZHZldWN0hZcENibVV1NjI2UjkyaFh4MEkGA1UdEQRCMECCPm5xbnc0a2M0Yzc3ZmI0N2xrNTJtNWw1N2g0dGN4Y2VvN3lteGVrZm43eWg1bTY2dDRqdjJvbGFkLm9uaW9uMAoGCCqGSM49BAMCA0cAMEQCICZf4Fh9eBkocEmLMt7oJftEOve4w3qnnzRQWRSW5zF+AiAjskyYorG61BgClMVp8mjQGnSekMbqSN8stkzHIv/n/A==',
}

const emptyAsyncIterable = async function* () {}

/**
 * The only mock in this file: an in-memory stand-in for the IPFS blockstore that access controller
 * factories use to persist their ACL manifest. It has nothing to do with identity or signatures.
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

/**
 * A team member, with the production identity provider and identity service bound to that member's
 * own chain. Signing happens on the attacker's party; verification always happens on Alice's, whose
 * chain holds every member and the private channel role.
 */
interface Party {
  chain: SigChain
  sigchainService: SigChainService
  provider: LFAIdentityProvider
  identities: LFAIdentities
  identity: LFAIdentity
  userId: string
  deviceId: string
  deviceKey: string
}

const sigchainServiceFor = (chain: SigChain): SigChainService =>
  ({
    get user() {
      return chain.user
    },
    get activeTeamId() {
      return chain.team!.id
    },
    getActiveChain: () => chain,
    getChain: (teamId: string, throwError = true) => {
      if (teamId !== chain.team!.id) {
        if (throwError) throw new Error(`No chain found for team ID ${teamId}`)
        return undefined
      }
      return chain
    },
  }) as unknown as SigChainService

const partyFor = async (chain: SigChain): Promise<Party> => {
  const sigchainService = sigchainServiceFor(chain)
  const provider = new LFAIdentityProvider(serializer, sigchainService)
  const identities = new LFAIdentities(sigchainService, provider, serializer)
  return {
    chain,
    sigchainService,
    provider,
    identities,
    identity: await identities.createIdentity({ id: chain.user.userId } as never),
    userId: chain.user.userId,
    deviceId: chain.device.deviceId,
    deviceKey: chain.device.keys.signature.publicKey,
  }
}

const joinTeam = (admin: SigChain): SigChain => {
  const invite = admin.invites.createUserInvite()
  const context = UserService.createFromInviteSeed({ seed: invite.seed })
  admin.invites.admitMemberFromInvite(InviteService.createMemberAdmission({ seed: invite.seed, context }))
  return SigChain.joinForTesting(context, admin.team!.save(), admin.team!.teamKeyring())
}

const identityClaim = (metadata: LFAIdentityMetadata): string =>
  uint8arrays.toString(serializer.serialize(metadata, SerializerEncodingType.UINT8ARRAY), 'hex')

const metadataOf = (party: Party, overrides: Partial<LFAIdentityMetadata> = {}): LFAIdentityMetadata => ({
  id: party.userId,
  deviceId: party.deviceId,
  teamId: party.chain.team!.id,
  publicKey: party.deviceKey as LFAIdentityMetadata['publicKey'],
  ...overrides,
})

/** Sign a genuine OrbitDB entry with this party's real LFA device key, via OrbitDB's own `Entry`. */
const signEntry = async (signer: Party, payload: unknown): Promise<LogEntry<any>> =>
  (await Entry.create(signer.identity as never, LOG_ID, payload as never)) as unknown as LogEntry<any>

/**
 * Rewrite the writer fields of an already-signed entry and re-encode it, exactly as an attacker
 * publishing a doctored entry would. The signature stays the original signer's, because neither
 * `identity` nor `key` is covered by it.
 */
const claimWriter = async (entry: LogEntry<any>, claim: { identity: string; key: string }): Promise<LogEntry<any>> => {
  const { hash: _hash, bytes: _bytes, ...body } = entry as any
  // `Entry.encode` is part of the module's runtime surface but missing from its published typings.
  return (await (Entry as any).encode({
    ...body,
    identity: claim.identity,
    key: claim.key,
  })) as LogEntry<any>
}

/**
 * The three writer claims the issue describes. The attacker always holds the signing key; only what
 * the entry says about its writer changes.
 */
const VARIANTS: [string, number][] = [
  ["the victim's identity with the attacker's signing key", 0],
  ["the victim's user id on the attacker's own device", 1],
  ["the victim's identity and key over the attacker's signature", 2],
]

const substitutionFor = (attacker: Party, victim: Party, variant: number): { identity: string; key: string } => {
  switch (variant) {
    case 0:
      return { identity: identityClaim(metadataOf(victim)), key: attacker.deviceKey }
    case 1:
      return { identity: identityClaim(metadataOf(attacker, { id: victim.userId })), key: attacker.deviceKey }
    default:
      return { identity: identityClaim(metadataOf(victim)), key: victim.deviceKey }
  }
}

const substituted = async (attacker: Party, victim: Party, variant: number, payload: unknown): Promise<LogEntry<any>> =>
  claimWriter(await signEntry(attacker, payload), substitutionFor(attacker, victim, variant))

type Admission = 'accepted' | 'rejected-by-access-control' | 'rejected-by-signature'

/**
 * Mirrors what OrbitDB does when an entry arrives (`Log.joinEntry` in @orbitdb/core): the access
 * controller authorizes the writer first, then the entry signature is verified.
 *
 * Since the writer chokepoint verifies the signature itself, `rejected-by-signature` is unreachable
 * through any access controller: whatever OrbitDB's second pass would catch, `canAppend` has already
 * caught. Every substitution below is asserted as `rejected-by-access-control`, never as merely "not
 * accepted", so that guarantee cannot quietly regress into relying on OrbitDB.
 */
const admit = async (access: any, verifier: Party, entry: LogEntry<any>): Promise<Admission> => {
  if (!(await access.canAppend(entry))) return 'rejected-by-access-control'
  if (!(await Entry.verify(verifier.identities as never, entry as never))) return 'rejected-by-signature'
  return 'accepted'
}

const attachEmptyLog = (access: any): void => {
  access.setLogContext({ traverse: async function* () {} })
}

/** The bytes an OrbitDB entry signature covers, as `Entry.verify` recomputes them. */
const signedBytes = async (entry: LogEntry<any>): Promise<Uint8Array> => {
  const anyEntry = entry as any
  const value = {
    id: anyEntry.id,
    payload: anyEntry.payload,
    next: anyEntry.next,
    refs: anyEntry.refs,
    clock: anyEntry.clock,
    v: anyEntry.v,
  }
  const { bytes } = await Block.encode({ value, codec: dagCbor, hasher: sha256 })
  return bytes
}

/**
 * The resolution the fix replaced, reconstructed here so the substituted entries above are shown to
 * be a working attack rather than merely malformed data. Before the fix the writer came straight out
 * of `entry.identity` with only a "is this user on the team" check, and the signature was verified
 * against the key of whichever device the LFA envelope named, so `entry.key` was never consulted and
 * the identity was never bound to it.
 */
const legacyResolution = async (
  verifier: Party,
  entry: LogEntry<any>
): Promise<{ writerId: string; signatureIsValid: boolean }> => {
  const writer = await verifier.identities.getIdentity(entry.identity)
  const envelope = serializer.deserialize<SignatureWithTeamId>(uint8arrays.fromString((entry as any).sig, 'hex'))
  const device = verifier.chain.team!.device(envelope.author.name, { includeRemoved: true })
  return {
    writerId: writer.id,
    signatureIsValid: signatures.verify({
      payload: await signedBytes(entry),
      signature: envelope.signature,
      publicKey: device.keys.signature,
      context: LFA_ORBITDB_ENTRY_SIGNATURE_CONTEXT,
    }),
  }
}

describe('OrbitDB signer substitution (#150)', () => {
  let alice: Party
  let bob: Party
  let carol: Party
  let teamId: string
  let privateChannelRole: string

  beforeAll(async () => {
    // Alice founds the team, so she is its only admin. Bob and Carol join as plain members.
    const aliceChain = SigChain.create()
    const bobChain = joinTeam(aliceChain)
    const carolChain = joinTeam(aliceChain)

    // A private channel whose only participant is Alice. Bob is an outsider to it.
    privateChannelRole = aliceChain.channels.create()

    alice = await partyFor(aliceChain)
    bob = await partyFor(bobChain)
    carol = await partyFor(carolChain)
    teamId = aliceChain.team!.id
  })

  /**
   * Every substitution has to die in `canAppend`, with no help from the signature pass OrbitDB runs
   * afterwards. A caller that authorizes on the writer the access controller resolved gets no second
   * chance, so "the entry was eventually refused" is not a strong enough claim to assert.
   */
  const expectRejectedByCanAppendAlone = async (access: any, entry: LogEntry<any>): Promise<void> => {
    await expect(access.canAppend(entry)).resolves.toBe(false)
    await expect(admit(access, alice, entry)).resolves.toEqual('rejected-by-access-control')
  }

  it('builds a team where only Alice holds the privileges under attack', () => {
    const chain = alice.chain
    expect(chain.roles.memberIsAdmin(alice.userId)).toBe(true)
    expect(chain.roles.memberIsAdmin(bob.userId)).toBe(false)
    expect(chain.roles.memberHasRole(bob.userId, RoleName.MEMBER)).toBe(true)
    expect(chain.roles.memberHasRole(carol.userId, RoleName.MEMBER)).toBe(true)
    expect(chain.channels.canMemberCreatePublicChannel(alice.userId)).toBe(true)
    expect(chain.channels.canMemberCreatePublicChannel(bob.userId)).toBe(false)
    expect(chain.channels.canMemberDeletePublicChannel(alice.userId)).toBe(true)
    expect(chain.channels.canMemberDeletePublicChannel(bob.userId)).toBe(false)
    expect(chain.channels.canMemberDeletePrivateChannel(alice.userId, privateChannelRole)).toBe(true)
    expect(chain.channels.canMemberDeletePrivateChannel(bob.userId, privateChannelRole)).toBe(false)
    expect(chain.channels.memberInChannel(alice.userId, privateChannelRole)).toBe(true)
    expect(chain.channels.memberInChannel(bob.userId, privateChannelRole)).toBe(false)
  })

  describe('entry writer resolution', () => {
    const payload = { op: OrbitDbOp.DEL, key: PUBLIC_CHANNEL_ID }

    it('resolves an honest entry to the member who really signed it', async () => {
      const entry = await signEntry(bob, payload)

      expect(entry.key).toEqual(bob.deviceKey)
      const writer = await getVerifiedEntryWriter(alice.identities as never, entry)
      expect(writer?.id).toEqual(bob.userId)
      expect(writer?.deviceId).toEqual(bob.deviceId)
      await expect(Entry.verify(alice.identities as never, entry as never)).resolves.toBe(true)
    })

    it("rejects Bob's signature presented under Alice's identity", async () => {
      const entry = await substituted(bob, alice, 0, payload)

      await expect(getVerifiedEntryWriter(alice.identities as never, entry)).resolves.toBeUndefined()
    })

    it("rejects Alice's user id claimed on Bob's own device", async () => {
      const entry = await substituted(bob, alice, 1, payload)

      await expect(getVerifiedEntryWriter(alice.identities as never, entry)).resolves.toBeUndefined()
    })

    it("rejects Alice's device paired with Bob's signing key", async () => {
      const entry = await claimWriter(await signEntry(bob, payload), {
        identity: identityClaim(metadataOf(alice, { publicKey: bob.deviceKey as LFAIdentityMetadata['publicKey'] })),
        key: bob.deviceKey,
      })

      await expect(getVerifiedEntryWriter(alice.identities as never, entry)).resolves.toBeUndefined()
    })

    it('rejects an identity naming a user who was never on the team', async () => {
      const entry = await claimWriter(await signEntry(bob, payload), {
        identity: identityClaim(metadataOf(bob, { id: 'never-a-member' })),
        key: bob.deviceKey,
      })

      await expect(getVerifiedEntryWriter(alice.identities as never, entry)).resolves.toBeUndefined()
    })

    it("rejects Bob's own identity attributed to Alice's key", async () => {
      const entry = await claimWriter(await signEntry(bob, payload), {
        identity: identityClaim(metadataOf(bob)),
        key: alice.deviceKey,
      })

      await expect(getVerifiedEntryWriter(alice.identities as never, entry)).resolves.toBeUndefined()
    })

    it("rejects Bob's signature under Alice's identity and key", async () => {
      // The subtlest claim: the identity and the key agree with each other and with the chain, and
      // only the signature says otherwise. Nothing about the writer fields gives it away, so the
      // chokepoint has to verify the signature to catch it, which is what it now does.
      const entry = await substituted(bob, alice, 2, payload)

      await expect(getVerifiedEntryWriter(alice.identities as never, entry)).resolves.toBeUndefined()
      await expect(Entry.verify(alice.identities as never, entry as never)).resolves.toBe(false)
    })

    it('rejects an entry whose signature does not cover its payload', async () => {
      // Re-encoding with a different payload leaves an otherwise honest entry whose signature no
      // longer matches, which the chokepoint must reject as firmly as a substituted writer.
      const honest = await signEntry(bob, payload)
      const { hash: _hash, bytes: _bytes, ...body } = honest as any
      const tampered = (await (Entry as any).encode({
        ...body,
        payload: { op: OrbitDbOp.DEL, key: 'a-different-channel' },
      })) as LogEntry<any>

      await expect(getVerifiedEntryWriter(alice.identities as never, tampered)).resolves.toBeUndefined()
    })

    it.each(VARIANTS)('would have resolved to Alice before the fix, using %s', async (_name, variant) => {
      // Every substituted entry carries a signature that is genuinely valid for the device the LFA
      // envelope names, and an identity that names Alice. That combination is exactly what the old
      // resolution accepted, which is why the substitution was exploitable.
      const entry = await substituted(bob, alice, variant, payload)

      await expect(legacyResolution(alice, entry)).resolves.toEqual({
        writerId: alice.userId,
        signatureIsValid: true,
      })
    })
  })

  describe('ChannelMetadataAccessController', () => {
    const createAccess = async (
      isPublic: boolean,
      idToRoleName: Record<string, string> = {},
      verifier: Party = alice
    ) => {
      const controller = new ChannelMetadataAccessController(verifier.sigchainService)
      const factory = controller.createAccessControllerFunc({
        write: ['*'],
        sigchainService: verifier.sigchainService,
        isPublic,
        getPrivateChannelsByRolename: async () => ({ idToRoleName, roleNameToChannel: {} }),
      })
      return (factory as any)({
        orbitdb: { identity: { id: verifier.userId }, ipfs: createInMemoryIpfs() },
        identities: verifier.identities,
      })
    }

    const channelPut = (signer: Party) => ({
      op: OrbitDbOp.PUT,
      key: PUBLIC_CHANNEL_ID,
      value: signer.chain.crypto.encryptAndSign(
        { id: PUBLIC_CHANNEL_ID, name: 'general', description: 'a channel', owner: signer.userId, timestamp: 1 },
        MEMBER_SCOPE
      ) as EncryptedAndSignedPayload,
    })

    const publicDel = { op: OrbitDbOp.DEL, key: PUBLIC_CHANNEL_ID }
    const privateDel = { op: OrbitDbOp.DEL, key: PRIVATE_CHANNEL_ID }

    // Scenario 1: public channel metadata DEL, the executed proof of concept.
    it('accepts a public channel deletion by Alice and rejects the same deletion by Bob', async () => {
      const access = await createAccess(true)

      await expect(admit(access, alice, await signEntry(alice, publicDel))).resolves.toEqual('accepted')
      await expect(admit(access, alice, await signEntry(bob, publicDel))).resolves.toEqual('rejected-by-access-control')
    })

    it.each(VARIANTS)('rejects a public channel deletion by Bob claiming Alice, using %s', async (_name, variant) => {
      const access = await createAccess(true)

      await expectRejectedByCanAppendAlone(access, await substituted(bob, alice, variant, publicDel))
    })

    it('rejects the executed proof of concept in canAppend alone, with no help from OrbitDB', async () => {
      // The claim to beat is the third: identity and key both name Alice and both match the chain,
      // so only the signature is wrong. `canAppend` must reject it by itself, because a caller that
      // authorizes on the returned writer has no second chance.
      const access = await createAccess(true)

      await expect(access.canAppend(await signEntry(alice, publicDel))).resolves.toBe(true)
      for (const [, variant] of VARIANTS) {
        await expect(access.canAppend(await substituted(bob, alice, variant, publicDel))).resolves.toBe(false)
      }
      await expect(admit(access, alice, await substituted(bob, alice, 2, publicDel))).resolves.toEqual(
        'rejected-by-access-control'
      )
    })

    it("admits Alice's real entry into a real OrbitDB log and refuses Bob's substituted one", async () => {
      // End to end through @orbitdb/core's own `Log.joinEntry`, which runs the production access
      // controller and then verifies the entry signature, over in-memory storage.
      const access = await createAccess(true)
      const log = await Log(alice.identity as never, { logId: LOG_ID, access })

      const honest = await signEntry(alice, publicDel)
      await expect(log.joinEntry(honest)).resolves.toBeTruthy()
      await expect(log.has(honest.hash)).resolves.toBe(true)

      const substitutedEntry = await substituted(bob, alice, 2, publicDel)
      await expect(log.joinEntry(substitutedEntry)).rejects.toThrow(/not allowed to write to the log/)
      await expect(log.has(substitutedEntry.hash)).resolves.toBe(false)
    })

    // Scenario 2: public channel metadata PUT, i.e. channel creation by a non-admin.
    it('accepts a public channel creation by Alice and rejects the same creation by Bob', async () => {
      const access = await createAccess(true)
      attachEmptyLog(access)

      await expect(admit(access, alice, await signEntry(alice, channelPut(alice)))).resolves.toEqual('accepted')
      await expect(admit(access, alice, await signEntry(bob, channelPut(bob)))).resolves.toEqual(
        'rejected-by-access-control'
      )
    })

    it.each(VARIANTS)('rejects a public channel creation by Bob claiming Alice, using %s', async (_name, variant) => {
      const access = await createAccess(true)
      attachEmptyLog(access)

      await expectRejectedByCanAppendAlone(access, await substituted(bob, alice, variant, channelPut(bob)))
    })

    // Scenario 4: private channel metadata DEL, claiming a principal the chain lets delete it.
    it('accepts a private channel deletion by Alice and rejects the same deletion by Bob', async () => {
      const access = await createAccess(false, { [PRIVATE_CHANNEL_ID]: privateChannelRole })

      await expect(admit(access, alice, await signEntry(alice, privateDel))).resolves.toEqual('accepted')
      await expect(admit(access, alice, await signEntry(bob, privateDel))).resolves.toEqual(
        'rejected-by-access-control'
      )
    })

    it('rejects a signed private deletion by an ordinary member when the channel role mapping is unavailable', async () => {
      const access = await createAccess(false)
      const log = await Log(alice.identity as never, { logId: LOG_ID, access })
      const entry = await signEntry(bob, privateDel)
      try {
        expect(alice.chain.roles.memberHasRole(bob.userId, RoleName.MEMBER)).toBe(true)
        expect(alice.chain.roles.memberIsAdmin(bob.userId)).toBe(false)
        expect(alice.chain.channels.memberInChannel(bob.userId, privateChannelRole)).toBe(false)
        await expect(Entry.verify(alice.identities as never, entry as never)).resolves.toBe(true)
        await expect(access.canAppend(entry)).resolves.toBe(false)
        await expect(log.joinEntry(entry)).rejects.toThrow(/not allowed to write to the log/)
        await expect(log.has(entry.hash)).resolves.toBe(false)
      } finally {
        await log.close()
      }
    })

    it('syncs a recreated private channel past its historical deletion after explicitly re-adding a former member', async () => {
      const ownerChain = SigChain.create()
      const memberChain = joinTeam(ownerChain)
      const oldRole = ownerChain.channels.createWithMembers([memberChain.user.userId])
      const replacementRole = ownerChain.channels.create()
      const owner = await partyFor(ownerChain)
      const oldId = 'deleted-private-channel'
      const replacementId = 'replacement-private-channel'
      const channelPut = (id: string, roleName: string) => ({
        op: OrbitDbOp.PUT,
        key: id,
        value: ownerChain.crypto.encryptAndSign(
          {
            id,
            name: 'same-private-name',
            description: 'private',
            owner: owner.userId,
            timestamp: 1,
            public: false,
            roleName,
          },
          { type: EncryptionScopeType.ROLE, name: roleName }
        ),
      })
      const oldPut = channelPut(oldId, oldRole)
      const replacementPut = channelPut(replacementId, replacementRole)
      const memberBeforeGrant = SigChain.joinForTesting(
        memberChain.context,
        ownerChain.save(),
        ownerChain.team!.teamKeyring()
      )
      expect(memberBeforeGrant.crypto.decryptAndVerify(oldPut.value.encrypted, oldPut.value.signature).isValid).toBe(
        true
      )
      expect(() =>
        memberBeforeGrant.crypto.decryptAndVerify(replacementPut.value.encrypted, replacementPut.value.signature)
      ).toThrow()

      const blocks = await MemoryStorage()
      const sourceAccess = await createAccess(false, { [oldId]: oldRole, [replacementId]: replacementRole }, owner)
      const source = await Log(owner.identity as never, { logId: LOG_ID, access: sourceAccess, entryStorage: blocks })
      sourceAccess.setLogContext(source)
      try {
        await source.append(oldPut)
        const historicalDelete = await source.append({ op: OrbitDbOp.DEL, key: oldId })
        const replacementEntry = await source.append(replacementPut)
        if (!historicalDelete || !replacementEntry) throw new Error('Source log entries were not created')

        ownerChain.channels.addMember(memberChain.user.userId, replacementRole)
        const member = await partyFor(
          SigChain.joinForTesting(memberChain.context, ownerChain.save(), ownerChain.team!.teamKeyring())
        )
        // A peer's current metadata mapping has no entry for the deleted channel. Joining the
        // replacement head still verifies the historical DEL through OrbitDB's ancestor traversal.
        const receiverAccess = await createAccess(false, { [replacementId]: replacementRole }, member)
        const receiver = await Log(member.identity as never, {
          logId: LOG_ID,
          access: receiverAccess,
          entryStorage: blocks,
        })
        receiverAccess.setLogContext(receiver)
        try {
          await expect(receiver.joinEntry(replacementEntry)).resolves.toBe(true)
          await expect(receiver.has(historicalDelete.hash)).resolves.toBe(true)
          await expect(receiver.has(replacementEntry.hash)).resolves.toBe(true)
          const received = await receiver.get(replacementEntry.hash)
          const encrypted = received.payload.value as EncryptedAndSignedPayload
          expect(member.chain.crypto.decryptAndVerify(encrypted.encrypted, encrypted.signature)).toMatchObject({
            isValid: true,
            contents: { id: replacementId, name: 'same-private-name', roleName: replacementRole },
          })
        } finally {
          await receiver.close()
        }
      } finally {
        await source.close()
      }
    })

    it.each(VARIANTS)('rejects a private channel deletion by Bob claiming Alice, using %s', async (_name, variant) => {
      const access = await createAccess(false, { [PRIVATE_CHANNEL_ID]: privateChannelRole })

      await expectRejectedByCanAppendAlone(access, await substituted(bob, alice, variant, privateDel))
    })
  })

  // Scenario 2 again, at the second consumer of the same principal: the metadata index validator.
  describe('ChannelsService.validateChannelEntryMetadata', () => {
    let channelsService: ChannelsService

    beforeAll(() => {
      channelsService = new ChannelsService(
        'orbitdb-dir',
        'ipfs-repo-path',
        {} as never,
        { identities: alice.identities } as never,
        {} as never,
        alice.sigchainService,
        {} as never
      )
    })

    const channelPut = (signer: Party) => ({
      op: OrbitDbOp.PUT,
      key: PUBLIC_CHANNEL_ID,
      value: signer.chain.crypto.encryptAndSign(
        {
          id: PUBLIC_CHANNEL_ID,
          name: 'general',
          description: 'a channel',
          owner: signer.userId,
          timestamp: 1,
          public: true,
        },
        MEMBER_SCOPE
      ) as EncryptedAndSignedPayload,
    })

    it('accepts a public channel created by Alice and rejects the same channel created by Bob', async () => {
      await expect(
        channelsService.validatePublicChannelMetadataEntry(await signEntry(alice, channelPut(alice)))
      ).resolves.toBe(true)
      await expect(
        channelsService.validatePublicChannelMetadataEntry(await signEntry(bob, channelPut(bob)))
      ).resolves.toBe(false)
    })

    it.each(VARIANTS)('rejects a public channel Bob creates under Alice, using %s', async (_name, variant) => {
      const entry = await substituted(bob, alice, variant, channelPut(bob))

      await expect(channelsService.validatePublicChannelMetadataEntry(entry)).resolves.toBe(false)
    })
  })

  // Scenario 3: deleting another member's profile, through both rules that permit a profile DEL.
  describe('UserProfileAccessController', () => {
    const createAccess = async () => {
      const controller = new UserProfileAccessController(alice.sigchainService)
      const factory = controller.createAccessControllerFunc({ write: ['*'], sigchainService: alice.sigchainService })
      return (factory as any)({
        orbitdb: { identity: { id: alice.userId }, ipfs: createInMemoryIpfs() },
        identities: alice.identities,
      })
    }

    const profilePut = (signer: Party) => {
      const profile: UserProfile = { userId: signer.userId, nickname: 'nickname' }
      return {
        op: OrbitDbOp.PUT,
        key: signer.userId,
        value: signer.chain.crypto.encryptAndSign(profile, MEMBER_SCOPE) as EncryptedAndSignedPayload,
      }
    }

    const deleteCarolsProfile = () => ({ op: OrbitDbOp.DEL, key: carol.userId })

    it("accepts Carol's own profile and lets Carol and the admin delete it", async () => {
      const access = await createAccess()

      await expect(admit(access, alice, await signEntry(carol, profilePut(carol)))).resolves.toEqual('accepted')
      await expect(admit(access, alice, await signEntry(carol, deleteCarolsProfile()))).resolves.toEqual('accepted')
      await expect(admit(access, alice, await signEntry(alice, deleteCarolsProfile()))).resolves.toEqual('accepted')
    })

    it("rejects Bob deleting Carol's profile as himself", async () => {
      const access = await createAccess()

      await expect(admit(access, alice, await signEntry(bob, deleteCarolsProfile()))).resolves.toEqual(
        'rejected-by-access-control'
      )
    })

    it.each(VARIANTS)(
      "rejects Bob deleting Carol's profile while claiming Carol, its owner, using %s",
      async (_name, variant) => {
        const access = await createAccess()

        await expectRejectedByCanAppendAlone(access, await substituted(bob, carol, variant, deleteCarolsProfile()))
      }
    )

    it.each(VARIANTS)(
      "rejects Bob deleting Carol's profile while claiming Alice, an admin, using %s",
      async (_name, variant) => {
        const access = await createAccess()

        await expectRejectedByCanAppendAlone(access, await substituted(bob, alice, variant, deleteCarolsProfile()))
      }
    )
  })

  // Scenario 5: appending to a private channel's message log from outside that channel.
  describe('PrivateMessagesAccessController', () => {
    const createAccess = async () => {
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
     * Bob is not in the channel role, so he cannot encrypt to it. He fabricates the envelope shape
     * instead, which is all the access controller inspects: it never decrypts the message.
     */
    const forgedMessage = (): EncryptedMessage =>
      ({
        id: 'private-message-id',
        contents: {
          contents: new Uint8Array([1, 2, 3]),
          scope: { type: EncryptionScopeType.ROLE, name: privateChannelRole, generation: 0 },
        },
        createdAt: 1,
        channelId: PRIVATE_CHANNEL_ID,
        teamId,
        encSignature: { signature: 'forged', author: { type: 'USER', name: bob.userId, generation: 0 } },
      }) as unknown as EncryptedMessage

    const realMessage = (): EncryptedMessage => {
      const encrypted = alice.chain.crypto.encryptAndSign(
        { id: 'private-message-id', message: 'hello' },
        { type: EncryptionScopeType.ROLE, name: privateChannelRole }
      )
      return {
        id: 'private-message-id',
        contents: encrypted.encrypted,
        createdAt: 1,
        channelId: PRIVATE_CHANNEL_ID,
        teamId,
        encSignature: encrypted.signature,
      }
    }

    it('accepts a message from Alice, a channel participant, and rejects one from Bob', async () => {
      const access = await createAccess()

      await expect(
        admit(access, alice, await signEntry(alice, { op: OrbitDbOp.PUT, value: realMessage() }))
      ).resolves.toEqual('accepted')
      await expect(
        admit(access, alice, await signEntry(bob, { op: OrbitDbOp.PUT, value: forgedMessage() }))
      ).resolves.toEqual('rejected-by-access-control')
    })

    it.each(VARIANTS)(
      'rejects a private message from Bob claiming Alice, a participant, using %s',
      async (_name, variant) => {
        const access = await createAccess()
        const entry = await substituted(bob, alice, variant, { op: OrbitDbOp.PUT, value: forgedMessage() })

        await expectRejectedByCanAppendAlone(access, entry)
      }
    )
  })

  // Scenario 6: appending to a public channel's message log under another member's name.
  describe('MessagesAccessController', () => {
    const createAccess = async (write: string[] = ['*']) => {
      const controller = new MessagesAccessController(alice.sigchainService)
      // The public message controller now binds the writer to the message's author, team and
      // channel, so the security context the channel store passes has to be supplied here too.
      const factory = controller.createAccessControllerFunc({
        write,
        sigchainService: alice.sigchainService,
        channelId: PUBLIC_CHANNEL_ID,
        teamId,
      })
      return (factory as any)({
        orbitdb: { identity: { id: alice.userId }, ipfs: createInMemoryIpfs() },
        identities: alice.identities,
      })
    }

    const message = (signer: Party) => {
      const encrypted = signer.chain.crypto.encryptAndSign({ id: 'message-id', message: 'hello' }, MEMBER_SCOPE)
      const value: EncryptedMessage = {
        id: 'message-id',
        contents: encrypted.encrypted,
        createdAt: 1,
        channelId: PUBLIC_CHANNEL_ID,
        teamId,
        encSignature: encrypted.signature,
      }
      return { op: OrbitDbOp.PUT, value }
    }

    it('accepts honest messages from either member when the log is open to everyone', async () => {
      const access = await createAccess()

      await expect(admit(access, alice, await signEntry(alice, message(alice)))).resolves.toEqual('accepted')
      await expect(admit(access, alice, await signEntry(bob, message(bob)))).resolves.toEqual('accepted')
    })

    it.each(VARIANTS)('rejects a message Bob signs but attributes to Alice, using %s', async (_name, variant) => {
      const access = await createAccess()

      await expectRejectedByCanAppendAlone(access, await substituted(bob, alice, variant, message(bob)))
    })

    it('applies a restricted write list to the verified writer, not the claimed one', async () => {
      const access = await createAccess([alice.userId])

      await expect(admit(access, alice, await signEntry(alice, message(alice)))).resolves.toEqual('accepted')
      await expect(admit(access, alice, await signEntry(bob, message(bob)))).resolves.toEqual(
        'rejected-by-access-control'
      )
      for (const [, variant] of VARIANTS) {
        await expectRejectedByCanAppendAlone(access, await substituted(bob, alice, variant, message(bob)))
      }
    })
  })

  // Scenario 7: community metadata, where the writer must be the recorded community owner.
  describe('CommunityMetadataStore.validateCommunityMetadataEntry', () => {
    const localDbFor = (ownerOrbitDbIdentity: string | undefined) =>
      ({ getCurrentCommunity: async () => ({ ownerOrbitDbIdentity }) }) as never

    const metadataPut = (signer: Party) => ({
      op: OrbitDbOp.PUT,
      key: COMMUNITY_ID,
      value: signer.chain.crypto.encryptAndSign(
        { id: COMMUNITY_ID, ...COMMUNITY_CERTS },
        MEMBER_SCOPE
      ) as EncryptedAndSignedPayload,
    })

    const validate = (localDb: never, entry: LogEntry<any>) =>
      CommunityMetadataStore.validateCommunityMetadataEntry(
        localDb,
        alice.identities as never,
        alice.sigchainService,
        entry
      )

    it('accepts metadata written by the owner and rejects metadata written by anyone else', async () => {
      await expect(validate(localDbFor(alice.userId), await signEntry(alice, metadataPut(alice)))).resolves.toBe(true)
      await expect(validate(localDbFor(alice.userId), await signEntry(bob, metadataPut(bob)))).resolves.toBe(false)
    })

    it('rejects the entry when no community owner is recorded', async () => {
      await expect(validate(localDbFor(undefined), await signEntry(alice, metadataPut(alice)))).resolves.toBe(false)
    })

    it.each(VARIANTS)('rejects metadata Bob signs while claiming the owner, using %s', async (_name, variant) => {
      const entry = await substituted(bob, alice, variant, metadataPut(bob))

      await expect(validate(localDbFor(alice.userId), entry)).resolves.toBe(false)
    })
  })
})
