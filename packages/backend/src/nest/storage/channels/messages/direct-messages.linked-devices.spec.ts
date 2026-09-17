import EventEmitter from 'events'
import { Entry, type LogEntry } from '@orbitdb/core'
import { invitation, lockbox } from '@localfirst/auth'
import { MessageType, type ChannelMessage, type PublicChannel } from '@quiet/types'
import { dmMessage } from '../../../auth/services/crypto/direct-message-test-utils'
import { SigChain } from '../../../auth/sigchain'
import { SigChainService } from '../../../auth/sigchain.service'
import { InviteService } from '../../../auth/services/invites/invite.service'
import { DeviceService } from '../../../auth/services/members/device.service'
import { RoleName } from '../../../auth/services/roles/roles'
import { Serializer } from '../../../common/serializer.service'
import { LFAIdentityProvider } from '../../orbitDb/identity/lfa/lfa-identity.provider'
import { LFAIdentities } from '../../orbitDb/identity/lfa/lfa-identity.service'
import { ChannelMetadataAccessController } from '../orbitdb/ChannelMetadataAccessController'
import { OrbitDbOp } from '../../orbitDb/orbitdb.types'
import { PrivateMessagesAccessController } from './orbitdb/PrivateMessagesAccessController'
import { DirectMessagesService } from './direct-messages.service'

/**
 * A DM is addressed to a user's account key, and device linking hands a second device that same
 * account key through the admission lockbox. So the linked device should be able to read and write
 * the user's DMs - including ones that existed before it was linked - and should look to everyone
 * else exactly like the user, not like a new member.
 *
 * Nothing here had a test. These are the cases that would break if a DM were ever bound to a
 * device key, to a peer, or to the set of devices present when the conversation was created.
 *
 * These drive SigChain directly, with the admission shortcut documented on `admitDevice` below.
 * The real-admission counterpart lives in libp2p/integration-tests/device-link.spec.ts.
 */

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

type Party = Awaited<ReturnType<typeof partyFor>>

const collect = async (stream: AsyncIterable<Uint8Array>) => {
  const chunks: Uint8Array[] = []
  for await (const chunk of stream) chunks.push(chunk)
  return Buffer.concat(chunks.map(chunk => Buffer.from(chunk)))
}

async function* streamOf(value: Buffer) {
  yield new Uint8Array(value)
}

const attachment = (author: SigChain, channel: PublicChannel, header: string): ChannelMessage => {
  const base = dmMessage(author, channel)
  return {
    ...base,
    type: MessageType.File,
    message: '',
    media: {
      name: 'secret',
      ext: '.txt',
      path: null,
      size: 32,
      cid: 'bafkreigh2akiscaildcq2khwjeahntt3k6wk7gi2tqe7ms43hypsj7hazu',
      message: { id: base.id, channelId: channel.id },
      enc: { header, recipient: { type: 'DM', name: channel.id, generation: 0 } },
    },
  }
}

/** Join a member to the team by a real invitation, the way an invite link does. */
const joinByInvite = (owner: SigChain, name: string): SigChain => {
  const { seed } = owner.invites.createUserInvite()
  const invitee = SigChain.createFromInvite({ seed, name }, owner.team!.id)
  owner.invites.admitMemberFromInvite(InviteService.createMemberAdmission({ seed, context: invitee.localUserContext }))
  const joined = SigChain.joinForTesting(invitee.localUserContext, owner.save(), owner.team!.teamKeyring())
  owner.team!.merge(joined.team!.graph)
  return SigChain.load(owner.save(), invitee.localUserContext, owner.team!.teamKeyring())
}

/**
 * Link a second device by replaying what admission does to the graph: the device invite puts a
 * lockbox holding the USER's keys there, addressed to the starter key derived from the seed, and
 * the new device opens it and loads the team as that same user.
 *
 * This is a SHORTCUT, not production admission. Production builds a first-use device carrying no
 * trusted user id (SigChain.createFromDeviceInvite), obtains the graph and the user through an LFA
 * AuthConnection, and checks the expected identity when the admission transaction commits. Because
 * this helper constructs the admitted account context itself, it cannot notice if real admission
 * ever stopped handing the device the user's keys - the one thing every assertion below rests on.
 *
 * So the cases here are the cheap, exhaustive ones, and
 * libp2p/integration-tests/device-link.spec.ts carries the same DM assertions - pre-link history
 * opens, and the linked device writes as the user - over a device admitted for real.
 */
const admitDevice = (user: SigChain, deviceName: string) => {
  const { seed } = user.invites.createDeviceInvite()
  const device = DeviceService.generateDeviceForUser(user.user.userId)
  Object.assign(device, { deviceName })
  user.invites.admitDeviceFromInvite(InviteService.createDeviceAdmission({ seed, device }))
  const starter = invitation.generateStarterKeys(seed)
  const delivery = user.team!.state.lockboxes.find(box => box.recipient.publicKey === starter.encryption.publicKey)
  expect(delivery).toBeDefined()
  const keys = (lockbox as { open: typeof import('@localfirst/auth/lockbox/open').open }).open(delivery!, starter)
  return {
    context: { device, user: { userId: user.user.userId, userName: user.user.userName, keys } },
    // The graph as it stood at admission. A device that comes up later replicates forward from
    // here, which is why it can hold a descriptor naming someone it has not heard of yet.
    snapshot: user.save(),
    keyring: user.team!.teamKeyring(),
  }
}

/** Bring the admitted device up on a given view of the graph. */
const loadDevice = ({ context, snapshot, keyring }: ReturnType<typeof admitDevice>): SigChain => {
  const linked = SigChain.load(snapshot, context, keyring)
  linked.team!.join(keyring)
  return linked
}

const linkDevice = (user: SigChain, deviceName: string): SigChain => loadDevice(admitDevice(user, deviceName))

/** Bring a chain up to another's view of the team graph, as replication would. */
const sync = (to: SigChain, from: SigChain) => to.team!.merge(from.team!.graph)

describe('direct messages across a user’s linked devices', () => {
  let alice: SigChain // Alice's first device: creates the team
  let aliceLinked: SigChain // Alice's second device, admitted by a device invite
  let bob: SigChain // another member, the other side of the DM
  let dave: SigChain // a community admin who is not in the DM

  let dmBeforeLinking: PublicChannel
  let historyBeforeLinking: ReturnType<SigChain['directMessages']['sealMessage']>
  let attachmentBeforeLinking: {
    encrypted: ReturnType<SigChain['directMessages']['sealMessage']>
    cipherChunks: Uint8Array[]
    header: Uint8Array
    plain: Buffer
  }

  beforeAll(async () => {
    alice = SigChain.create({ name: 'Alice' })
    bob = joinByInvite(alice, 'Bob')
    dave = joinByInvite(alice, 'Dave')
    // A community admin outside the conversation: the strongest role the app has to offer.
    alice.roles.addMember(dave.user.userId, RoleName.ADMIN)
    sync(bob, alice)
    sync(dave, alice)

    // Bob opens a DM with Alice while Alice has exactly one device.
    dmBeforeLinking = bob.directMessages.create([alice.user.userId])
    const descriptor = bob.directMessages.descriptor(dmBeforeLinking.id)
    alice.directMessages.openDescriptor(descriptor, dmBeforeLinking.id)
    historyBeforeLinking = bob.directMessages.sealMessage(dmMessage(bob, dmBeforeLinking), dmBeforeLinking.id)

    // Encrypt it now, and keep the bytes: a stream is read once, and the point of the test is
    // that the SAME ciphertext opens on a device that did not exist when it was written.
    const plain = Buffer.from('an attachment sent before the second device existed')
    const sealed = bob.directMessages.encryptStream(streamOf(plain), dmBeforeLinking.id)
    const cipherChunks: Uint8Array[] = []
    for await (const chunk of sealed.encryptStream) cipherChunks.push(chunk)
    const file = attachment(bob, dmBeforeLinking, Buffer.from(sealed.header).toString('base64url'))
    attachmentBeforeLinking = {
      encrypted: bob.directMessages.sealMessage(file, dmBeforeLinking.id),
      cipherChunks,
      header: sealed.header,
      plain,
    }

    // Only now does Alice link a second device.
    aliceLinked = linkDevice(alice, 'Alice phone')
    sync(alice, aliceLinked)
    sync(bob, aliceLinked)
    sync(dave, aliceLinked)
  })

  it('links a second device into the same account rather than adding a member', () => {
    expect(aliceLinked.user.userId).toBe(alice.user.userId)
    expect(aliceLinked.device.deviceId).not.toBe(alice.device.deviceId)
    expect(aliceLinked.team!.members(alice.user.userId).devices).toHaveLength(2)
    // Bob sees one more device, not one more person.
    expect(
      bob
        .team!.members()
        .map(member => member.userId)
        .sort()
    ).toEqual([alice.user.userId, bob.user.userId, dave.user.userId].sort())
  })

  it('opens a DM and its history that predate the link', () => {
    const descriptor = bob.directMessages.descriptor(dmBeforeLinking.id)
    const opened = aliceLinked.directMessages.openDescriptor(descriptor, dmBeforeLinking.id)
    expect(opened).toMatchObject({ id: dmBeforeLinking.id, memberIds: dmBeforeLinking.memberIds })
    expect(aliceLinked.directMessages.openMessage(historyBeforeLinking, dmBeforeLinking.id).message).toContain(
      'Confidential DM'
    )
  })

  it('reaches every device of a DM created after the link', () => {
    const channel = bob.directMessages.create([alice.user.userId])
    const descriptor = bob.directMessages.descriptor(channel.id)
    expect(alice.directMessages.openDescriptor(descriptor, channel.id)).toMatchObject({ id: channel.id })
    expect(aliceLinked.directMessages.openDescriptor(descriptor, channel.id)).toMatchObject({ id: channel.id })

    const message = bob.directMessages.sealMessage(dmMessage(bob, channel), channel.id)
    for (const reader of [alice, aliceLinked]) {
      expect(reader.directMessages.openMessage(message, channel.id).message).toContain('Confidential DM')
    }
  })

  it('sends from the linked device as Alice, and the others accept the writer', async () => {
    aliceLinked.directMessages.openDescriptor(bob.directMessages.descriptor(dmBeforeLinking.id), dmBeforeLinking.id)
    const sent = aliceLinked.directMessages.sealMessage(dmMessage(aliceLinked, dmBeforeLinking), dmBeforeLinking.id)

    // Authorship is the account, not the device.
    expect(sent.encSignature.author.name).toBe(alice.user.userId)
    for (const reader of [alice, bob]) {
      const opened = reader.directMessages.openMessage(sent, dmBeforeLinking.id)
      expect(opened.userId).toBe(alice.user.userId)
      expect(opened.message).toContain('Confidential DM')
    }

    // And the DM log's access controller lets the entry in, on both of the others' replicas.
    const linkedParty = await partyFor(aliceLinked)
    for (const chain of [alice, bob]) {
      const reader = await partyFor(chain)
      const canAppend = (new PrivateMessagesAccessController(reader.service) as any).canAppend(
        {
          write: dmBeforeLinking.memberIds,
          channelId: dmBeforeLinking.id,
          teamId: chain.team!.id,
          sigchainService: reader.service,
          roleName: '',
          directMessage: true,
        },
        reader.identities
      )
      expect(await canAppend(await entryFrom(linkedParty, sent))).toBe(true)
      expect(await new DirectMessagesService(reader.service).onConsume(sent, dmBeforeLinking)).toMatchObject({
        verified: true,
        userId: alice.user.userId,
      })
    }
  })

  it('decrypts an attachment from before the link, and sends one the others can read', async () => {
    aliceLinked.directMessages.openDescriptor(bob.directMessages.descriptor(dmBeforeLinking.id), dmBeforeLinking.id)
    // The message envelope itself opens on the linked device...
    const opened = aliceLinked.directMessages.openMessage(attachmentBeforeLinking.encrypted, dmBeforeLinking.id)
    expect(opened.media?.name).toEqual('secret')
    // ...and so do the file's bytes.
    async function* earlier() {
      yield* attachmentBeforeLinking.cipherChunks
    }
    const received = await collect(
      aliceLinked.directMessages.decryptStream(earlier(), attachmentBeforeLinking.header, dmBeforeLinking.id)
    )
    expect(received.toString()).toEqual(attachmentBeforeLinking.plain.toString())

    const outgoing = Buffer.from('an attachment sent from the linked device')
    const sealed = aliceLinked.directMessages.encryptStream(streamOf(outgoing), dmBeforeLinking.id)
    const cipherChunks: Uint8Array[] = []
    for await (const chunk of sealed.encryptStream) cipherChunks.push(chunk)
    const replay = async function* () {
      yield* cipherChunks
    }
    for (const reader of [alice, bob]) {
      expect(
        (await collect(reader.directMessages.decryptStream(replay(), sealed.header, dmBeforeLinking.id))).toString()
      ).toEqual(outgoing.toString())
    }
  })

  it('shows the conversation with myself on both of my devices', () => {
    const selfDm = alice.directMessages.create([])
    expect(selfDm.memberIds).toEqual([alice.user.userId])
    const descriptor = alice.directMessages.descriptor(selfDm.id)
    expect(aliceLinked.directMessages.openDescriptor(descriptor, selfDm.id)).toMatchObject({ id: selfDm.id })

    const note = alice.directMessages.sealMessage(dmMessage(alice, selfDm), selfDm.id)
    expect(aliceLinked.directMessages.openMessage(note, selfDm.id).userId).toBe(alice.user.userId)

    const fromPhone = aliceLinked.directMessages.sealMessage(dmMessage(aliceLinked, selfDm), selfDm.id)
    expect(alice.directMessages.openMessage(fromPhone, selfDm.id).message).toContain('Confidential DM')
  })

  it('still shuts an outside community admin out of the conversation', () => {
    const descriptor = bob.directMessages.descriptor(dmBeforeLinking.id)
    // The descriptor is publicly verifiable, so Dave can check it is authentic...
    expect(dave.directMessages.validateDescriptor(descriptor, dmBeforeLinking.id)).toBeDefined()
    expect(dave.team!.memberHasRole(dave.user.userId, RoleName.ADMIN)).toBe(true)
    // ...and still cannot open it, or anything sealed with its key.
    expect(dave.directMessages.openDescriptor(descriptor, dmBeforeLinking.id)).toBeUndefined()
    expect(() => dave.directMessages.openMessage(historyBeforeLinking, dmBeforeLinking.id)).toThrow()
    expect(dave.directMessages.has(dmBeforeLinking.id)).toBe(false)
  })

  it('keeps the recipient box on the account generation the linked device holds', () => {
    // The box is opened with chain.user.keys, which admission handed to the second device
    // unchanged. If linking rotated the account keys, or bumped the generation without
    // re-boxing, every DM that predates the link would stop opening.
    expect(aliceLinked.user.keys.generation).toBe(alice.user.keys.generation)
    expect(aliceLinked.team!.members(alice.user.userId).keys.generation).toBe(aliceLinked.user.keys.generation)
    expect(
      aliceLinked.directMessages.openDescriptor(bob.directMessages.descriptor(dmBeforeLinking.id), dmBeforeLinking.id)
    ).toBeDefined()
  })

  it('admits a descriptor that arrives before the chain knows its members, and reads it after', async () => {
    // A linked device can finish admission and start replicating before its copy of the team graph
    // contains a member who joined meanwhile. That descriptor is honest, so the metadata log has to
    // KEEP it: an access-controller refusal is permanent, because retryIndexingUnindexedEntries
    // re-runs the index over the log and a refused QSS head is dropped from the pending set.
    // dm-metadata-stale-graph.spec.ts proves the recovery through the real store; this covers the
    // two validation halves on a device that is genuinely behind.
    const admission = admitDevice(alice, 'Alice tablet')

    // Erin joins and Bob starts a conversation naming her, all while the tablet is still offline.
    const latecomer = joinByInvite(alice, 'Erin')
    sync(bob, alice)
    const withLatecomer = bob.directMessages.create([alice.user.userId, latecomer.user.userId])
    const descriptor = bob.directMessages.descriptor(withLatecomer.id)

    const behind = loadDevice(admission)
    expect(behind.team!.has(latecomer.user.userId)).toBe(false)

    // The graph-independent half passes, so the entry is admissible...
    expect(behind.directMessages.validateDescriptorShape(descriptor, withLatecomer.id)).toBeDefined()
    // ...while the full check, which the index runs, still refuses to expose the channel.
    expect(() => behind.directMessages.validateDescriptor(descriptor, withLatecomer.id)).toThrow()
    expect(behind.directMessages.has(withLatecomer.id)).toBe(false)

    const behindParty = await partyFor(behind)
    const bobParty = await partyFor(bob)
    const history: LogEntry[] = []
    const canAppend = (new ChannelMetadataAccessController(behindParty.service) as any).canAppend(
      { write: ['*'], isPublic: false, isDirectMessage: true, sigchainService: behindParty.service },
      behindParty.identities,
      () => ({
        traverse: async function* () {
          yield* history
        },
      })
    )
    const entry = await metadataEntry(bobParty, withLatecomer.id, descriptor)
    expect(await canAppend(entry)).toBe(true)

    // The same bytes, once the graph has caught up: this is the pass
    // retryIndexingUnindexedEntries exists to make, and it now succeeds.
    sync(behind, bob)
    expect(await canAppend(entry)).toBe(true)
    expect(behind.directMessages.validateDescriptor(descriptor, withLatecomer.id)).toBeDefined()
    expect(behind.directMessages.openDescriptor(descriptor, withLatecomer.id)).toMatchObject({ id: withLatecomer.id })
  })
})

let entryClock = 0
const signEntry = async (party: Party, log: string, payload: unknown): Promise<LogEntry> =>
  (await Entry.create(
    party.identity as never,
    log,
    payload as never,
    { id: party.identity.publicKey, time: ++entryClock } as never
  )) as unknown as LogEntry

const entryFrom = async (party: Party, payload: unknown): Promise<LogEntry> =>
  signEntry(party, 'secure-dm-log', { op: 'ADD', value: payload })

const metadataEntry = async (party: Party, key: string, value: unknown): Promise<LogEntry> =>
  signEntry(party, 'channel-metadata', { op: OrbitDbOp.PUT, key, value })
