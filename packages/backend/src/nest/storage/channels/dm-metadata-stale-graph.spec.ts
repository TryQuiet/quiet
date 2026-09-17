import fs from 'fs'

import { Test, TestingModule } from '@nestjs/testing'
import { Entry, type LogEntry, useAccessController as orbitDbUseAccessController } from '@orbitdb/core'

import { SigChain } from '../../auth/sigchain'
import { SigChainService } from '../../auth/sigchain.service'
import { SigChainModule } from '../../auth/sigchain.service.module'
import { InviteService } from '../../auth/services/invites/invite.service'
import { EncryptedAndSignedPayload } from '../../auth/services/crypto/types'
import { TestModule } from '../../common/test.module'
import { spawnLibp2pInstancesInMemory } from '../../common/test-utils'
import { Serializer } from '../../common/serializer.service'
import { IpfsModule } from '../../ipfs/ipfs.module'
import { IpfsService } from '../../ipfs/ipfs.service'
import { Libp2pModule } from '../../libp2p/libp2p.module'
import { Libp2pService } from '../../libp2p/libp2p.service'
import { LocalDbService } from '../../local-db/local-db.service'
import { StorageModule } from '../storage.module'
import { OrbitDbService } from '../orbitDb/orbitDb.service'
import { OrbitDbOp } from '../orbitDb/orbitdb.types'
import { KeyValueIndexedValidated, KeyValueIndexedValidatedType } from '../orbitDb/keyValueIndexedValidated'
import { LFAIdentityProvider } from '../orbitDb/identity/lfa/lfa-identity.provider'
import { LFAIdentities } from '../orbitDb/identity/lfa/lfa-identity.service'
import { ChannelMetadataAccessController } from './orbitdb/ChannelMetadataAccessController'
import { ChannelsService } from './channels.service'

/**
 * A DM descriptor names every participant, and a device replicates the DM metadata log and the
 * team graph independently. So a descriptor naming somebody this device has not heard of yet is a
 * normal, transient state — not an attack — and it must survive until the graph catches up.
 *
 * It used to be refused by the metadata access controller, which kept it out of the OrbitDB log
 * altogether. Nothing recovers from that: `retryIndexingUnindexedEntries` re-runs the INDEX over
 * entries already in the log, and over QSS `orbitDb.service.joinHeads` treats `applyOperation` as
 * success and drops the pending head, so the descriptor is gone and the conversation never
 * appears. This spec drives the real store to prove the entry is now kept and indexed later.
 */
describe('DM metadata ingested against a stale team graph', () => {
  let module: TestingModule
  let libp2pService: Libp2pService
  let ipfsService: IpfsService
  let orbitDbService: OrbitDbService
  let localDbService: LocalDbService
  let sigchainService: SigChainService
  let channelsService: ChannelsService
  let accessController: ChannelMetadataAccessController

  /** The local device's chain: the DM's other participant, whose graph will lag. */
  let local: SigChain
  /** The author of the descriptor, and a member the local device already knows. */
  let author: SigChain
  /** A member who joins after the local device's graph snapshot. */
  let latecomerId: string
  let descriptor: EncryptedAndSignedPayload
  let channelId: string

  const openStores = new Set<KeyValueIndexedValidatedType<EncryptedAndSignedPayload>>()
  let staleSequence = 0

  const joinByInvite = (owner: SigChain, name: string): SigChain => {
    const { seed } = owner.invites.createUserInvite()
    const invitee = SigChain.createFromInvite({ seed, name }, owner.team!.id)
    owner.invites.admitMemberFromInvite(
      InviteService.createMemberAdmission({ seed, context: invitee.localUserContext })
    )
    const joined = SigChain.joinForTesting(invitee.localUserContext, owner.save(), owner.team!.teamKeyring())
    owner.team!.merge(joined.team!.graph)
    return SigChain.load(owner.save(), invitee.localUserContext, owner.team!.teamKeyring())
  }

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [TestModule, StorageModule, Libp2pModule, IpfsModule, SigChainModule],
    }).compile()

    libp2pService = await module.resolve(Libp2pService)
    await spawnLibp2pInstancesInMemory([module])
    ipfsService = await module.resolve(IpfsService)
    await ipfsService.createInstance()
    localDbService = await module.resolve(LocalDbService)
    sigchainService = module.get<SigChainService>(SigChainService)
    channelsService = await module.resolve(ChannelsService)
    accessController = await module.resolve(ChannelMetadataAccessController)

    // The local device creates the community, admits the author, and then falls behind: the
    // latecomer joins on a copy of the graph the local device never merges.
    local = await sigchainService.createChain(true)
    author = joinByInvite(local, 'Author')
    const ahead = SigChain.load(local.save(), local.localUserContext, local.team!.teamKeyring())
    const latecomer = joinByInvite(ahead, 'Latecomer')
    latecomerId = latecomer.user.userId
    author.team!.merge(ahead.team!.graph)

    const channel = author.directMessages.create([local.user.userId, latecomerId])
    channelId = channel.id
    descriptor = author.directMessages.descriptor(channelId)

    expect(local.team!.has(latecomerId)).toBe(false)

    orbitDbService = await module.resolve(OrbitDbService)
    await orbitDbService.create(ipfsService.ipfsInstance!)
  })

  afterAll(async () => {
    await Promise.all([...openStores].map(async store => store.close()))
    await orbitDbService?.stop()
    if (orbitDbService != null && fs.existsSync(orbitDbService.orbitDbDir)) {
      fs.rmSync(orbitDbService.orbitDbDir, { recursive: true })
    }
    await ipfsService?.stop()
    await libp2pService?.close()
    await localDbService?.close()
    await module?.close()
  })

  /** The DM metadata store exactly as ChannelsService opens it. */
  const openDmMetadataStore = async () => {
    const controllerFunc = accessController.createAccessControllerFunc({
      write: ['*'],
      sigchainService,
      isPublic: false,
      getPrivateChannelsByRolename: async () => ({ idToRoleName: {}, roleNameToId: {} }) as never,
      isDirectMessage: true,
    })
    orbitDbUseAccessController(controllerFunc as never)
    const store = await orbitDbService.open<KeyValueIndexedValidatedType<EncryptedAndSignedPayload>>(
      `dm-stale-graph-${Date.now()}`,
      {
        sync: false,
        Database: KeyValueIndexedValidated(channelsService.validateDirectMessageMetadataEntry.bind(channelsService)),
        AccessController: controllerFunc,
      }
    )
    openStores.add(store)
    return store
  }

  /**
   * A fresh descriptor naming somebody `local` has not replicated. Each test needs its own,
   * because proving recovery means merging the graph, which leaves `local` up to date.
   */
  const staleDescriptor = () => {
    // Only the community's admin can invite, so the fork is of the local (owner) graph. The
    // latecomer is admitted there and merged into the author, and never into `local`.
    const ahead = SigChain.load(local.save(), local.localUserContext, local.team!.teamKeyring())
    const latecomer = joinByInvite(ahead, `Latecomer-${++staleSequence}`)
    author.team!.merge(ahead.team!.graph)
    const channel = author.directMessages.create([local.user.userId, latecomer.user.userId])
    expect(local.team!.has(latecomer.user.userId)).toBe(false)
    return {
      channelId: channel.id,
      descriptor: author.directMessages.descriptor(channel.id),
      latecomerId: latecomer.user.userId,
    }
  }

  /** The descriptor as the author would put it, signed with the author's real LFA identity. */
  const authorEntry = async (
    store: KeyValueIndexedValidatedType<EncryptedAndSignedPayload>,
    value: EncryptedAndSignedPayload,
    key = channelId
  ): Promise<LogEntry<EncryptedAndSignedPayload>> => {
    const serializer = new Serializer()
    const authorService = {
      team: author.team,
      user: author.user,
      activeChain: author,
      activeTeamId: author.team!.id,
      getActiveChain: () => author,
      getChain: (teamId: string) => (teamId === author.team!.id ? author : undefined),
    } as unknown as SigChainService
    const identities = new LFAIdentities(authorService, new LFAIdentityProvider(serializer, authorService), serializer)
    const identity = await identities.createIdentity({ id: author.user.userId } as never)
    return (await Entry.create(
      identity as never,
      store.log.id,
      { op: OrbitDbOp.PUT, key, value } as never,
      { id: identity.publicKey, time: 1 } as never,
      []
    )) as unknown as LogEntry<EncryptedAndSignedPayload>
  }

  it('keeps the entry in the log and indexes the channel once the graph catches up', async () => {
    const store = await openDmMetadataStore()
    const stale = staleDescriptor()
    const entry = await authorEntry(store, stale.descriptor, stale.channelId)

    await store.applyOperation(entry.bytes)

    // In the log, because the writer is a known member who signed this exact manifest...
    const hashes: string[] = []
    for await (const logged of store.log.traverse()) hashes.push(logged.hash)
    expect(hashes).toContain(entry.hash)
    // ...but not yet readable, because a participant is still unknown here.
    expect(await store.get(stale.channelId)).toBeUndefined()

    // The graph catches up, which is what SigchainEvents.UPDATED reacts to.
    local.team!.merge(author.team!.graph)
    expect(local.team!.has(stale.latecomerId)).toBe(true)

    await store.retryIndexingUnindexedEntries()

    // The same bytes, never re-sent, now produce the channel.
    expect(await store.get(stale.channelId)).toBeDefined()
    expect(local.directMessages.openDescriptor(stale.descriptor, stale.channelId)?.memberIds).toContain(
      stale.latecomerId
    )
  })

  /**
   * The QSS pull path. `joinHeads` calls `applyOperation` and then drops the pending head whether
   * or not the entry was actually joined, so an access-controller refusal here is a permanent
   * loss with nothing left to retry. P2P sync reaches the same `applyOperation` through
   * `onSynced`, so this covers both ingest routes.
   */
  it('keeps a QSS-ingested descriptor and indexes it after the graph catches up', async () => {
    const store = await openDmMetadataStore()
    const stale = staleDescriptor()
    const entry = await authorEntry(store, stale.descriptor, stale.channelId)

    await orbitDbService.ingestEntries([entry as never])

    expect(await store.get(stale.channelId)).toBeUndefined()
    const hashes: string[] = []
    for await (const logged of store.log.traverse()) hashes.push(logged.hash)
    expect(hashes).toContain(entry.hash)

    local.team!.merge(author.team!.graph)
    await store.retryIndexingUnindexedEntries()

    expect(await store.get(stale.channelId)).toBeDefined()
  })

  it('still refuses a descriptor whose manifest does not match its key', async () => {
    const store = await openDmMetadataStore()
    const entry = await authorEntry(store, descriptor, 'dm_' + 'a'.repeat(64))

    await store.applyOperation(entry.bytes)

    const hashes: string[] = []
    for await (const logged of store.log.traverse()) hashes.push(logged.hash)
    expect(hashes).not.toContain(entry.hash)
  })

  it('still refuses a descriptor a member did not author', async () => {
    const store = await openDmMetadataStore()
    const forged = structuredClone(descriptor)
    forged.userId = local.user.userId
    const entry = await authorEntry(store, forged)

    await store.applyOperation(entry.bytes)

    const hashes: string[] = []
    for await (const logged of store.log.traverse()) hashes.push(logged.hash)
    expect(hashes).not.toContain(entry.hash)
  })
})
