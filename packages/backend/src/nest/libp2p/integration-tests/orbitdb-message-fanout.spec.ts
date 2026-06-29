import { jest } from '@jest/globals'
import { Entry, LogEntry } from '@orbitdb/core'

import { TestingModule } from '@nestjs/testing'
import { Libp2pService } from '../libp2p.service'
import { SigChainService } from '../../auth/sigchain.service'
import { Libp2pEvents, Libp2pNodeParams } from '../libp2p.types'
import { createLogger } from '../../common/logger'
import {
  spawnLibp2pInstancesInMemory,
  spawnTestModules,
  attachEventListeners,
  timelinesInclude,
} from '../../common/test-utils'
import { headsAreEqual, Hash } from '@localfirst/crdx'
import { OrbitDbService } from '../../storage/orbitDb/orbitDb.service'
import { IpfsService } from '../../ipfs/ipfs.service'
import { ChannelsService } from '../../storage/channels/channels.service'
import { PublicChannel } from '@quiet/types'
import { getBaseTypesFactory } from '@quiet/state-manager'
import { FactoryGirl } from 'factory-girl'
import waitForExpect from 'wait-for-expect'
import { StorageEvents } from '../../storage/storage.types'
import { LocalDbService } from '../../local-db/local-db.service'
import { generateProof, InviteResult, redactKeys, Team } from '@localfirst/auth'

const logger = createLogger('libp2p:orbitdb-message-fanout.test')

function stableStringify(obj: unknown): string {
  if (obj === null || typeof obj !== 'object') return JSON.stringify(obj)
  return (
    '{' +
    Object.keys(obj as Record<string, unknown>)
      .sort()
      .map(k => `${k}:${stableStringify((obj as Record<string, unknown>)[k])}`)
      .join(',') +
    '}'
  )
}

function deepArrayEqual(arr1: unknown[], arr2: unknown[]): boolean {
  if (arr1.length !== arr2.length) return false
  const key = (it: unknown) =>
    it && typeof it === 'object' && 'hash' in (it as any) ? (it as any).hash : stableStringify(it)

  const tally = (arr: unknown[]) => {
    const m = new Map<string, number>()
    for (const k of arr.map(key)) m.set(k, (m.get(k) ?? 0) + 1)
    return m
  }

  const m1 = tally(arr1)
  const m2 = tally(arr2)
  if (m1.size !== m2.size) return false
  for (const [k, n] of m1) if (m2.get(k) !== n) return false
  return true
}

/**
 * Checks if all ChannelsService instances have the same set of channels, and that each channel is identical across services.
 *
 * @param services - Array of ChannelsService instances to check.
 * @returns True if all services have the same channels, false otherwise.
 */
async function channelsSynced(services: ChannelsService[]): Promise<boolean> {
  const idSet = new Set<string>()
  const lists: PublicChannel[][] = []
  for (const svc of services) {
    const l = await svc.getChannels()
    lists.push(l)
    l.forEach(ch => idSet.add(ch.id))
  }
  const len0 = lists[0].length
  if (lists.some(l => l.length !== len0)) return false

  for (const id of idSet) {
    const refs = lists.map(l => l.find(c => c.id === id))
    if (refs.some(r => !r)) return false
    if (!refs.every(r => deepArrayEqual([refs[0]], [r!]))) return false
  }
  return true
}

/**
 * Checks if all services have the same set of entries for each channel (or a specific channel).
 *
 * @param services - Array of ChannelsService instances to check.
 * @param channelId - Optional channel ID to restrict the check to a single channel.
 * @returns True if all entries are synced for all channels (or the specified channel), false otherwise.
 */
async function channelEntriesSynced(services: ChannelsService[], channelId?: string): Promise<boolean> {
  const union = new Map<string, Set<string>>() // channelId → ids
  const chanIds = new Set<string>()

  for (const svc of services) {
    for (const ch of await svc.getChannels()) {
      if (channelId && ch.id !== channelId) continue
      chanIds.add(ch.id)
      const repo = svc.channelsRepos.get(ch.id)
      if (!repo) return false
      const ids = new Set((await repo.store.getEntries()).map(e => e.id))
      const bag = union.get(ch.id) ?? new Set<string>()
      ids.forEach(id => bag.add(id))
      union.set(ch.id, bag)
    }
  }

  for (const id of chanIds) {
    for (const svc of services) {
      const repo = svc.channelsRepos.get(id)
      if (!repo) return false
      const ids = new Set((await repo.store.getEntries()).map(e => e.id))
      const bag = union.get(id)!
      if (ids.size !== bag.size) return false
      for (const x of bag) if (!ids.has(x)) return false
    }
  }
  return true
}

async function waitForSync(
  services: ChannelsService[],
  channelId?: string,
  timeoutMs = 5_000,
  pollRate = 100
): Promise<number | undefined> {
  return new Promise(resolve => {
    const start = Date.now()
    const finishIf = async () => {
      if ((await channelsSynced(services)) && (await channelEntriesSynced(services, channelId))) {
        clearInterval(tick)
        clearTimeout(expire)
        resolve(Date.now() - start)
      }
    }
    const tick = setInterval(finishIf, pollRate)
    const expire = setTimeout(() => {
      clearInterval(tick)
      resolve(undefined)
    }, timeoutMs)
    services.forEach(svc => {
      svc.channels?.events.on('update', finishIf)
      svc.on(StorageEvents.CHANNEL_SUBSCRIBED, p => {
        if (!channelId || p.channelId === channelId) {
          svc.channelsRepos.get(p.channelId)?.store.getStore().events.on('update', finishIf)
        }
      })
      for (const [id, repo] of svc.channelsRepos) {
        if (!channelId || id === channelId) {
          repo.store.getStore().events.on('update', finishIf)
        }
      }
    })
  })
}

async function waitForSyncAndRun(
  services: ChannelsService[],
  performAction: () => void | Promise<void>,
  channelId?: string,
  timeoutMs = 5_000,
  pollRate = 100
): Promise<number | undefined> {
  return new Promise(resolve => {
    const start = Date.now()
    let phase: 'pre' | 'post' = 'pre'

    const maybeAdvance = async () => {
      const synced = (await channelsSynced(services)) && (await channelEntriesSynced(services, channelId))

      if (phase === 'pre' && synced) {
        phase = 'post'
        await performAction()
        return
      }
      if (phase === 'post' && synced) {
        cleanup()
        resolve(Date.now() - start)
      }
    }

    const poll = setInterval(maybeAdvance, pollRate)
    const timeout = setTimeout(() => {
      cleanup()
      resolve(undefined)
    }, timeoutMs)

    function cleanup() {
      clearInterval(poll)
      clearTimeout(timeout)
    }

    // listeners
    services.forEach(svc => {
      svc.channels?.events.on('update', maybeAdvance)
      svc.on(StorageEvents.CHANNEL_SUBSCRIBED, p => {
        if (!channelId || p.channelId === channelId) {
          svc.channelsRepos.get(p.channelId)?.store.getStore().events.on('update', maybeAdvance)
        }
      })
      for (const [id, repo] of svc.channelsRepos) {
        if (!channelId || id === channelId) {
          repo.store.getStore().events.on('update', maybeAdvance)
        }
      }
    })
  })
}

const N_PEERS = 3
jest.setTimeout(120_000)
describe(`OrbitDB Syncing with ${N_PEERS} peers`, () => {
  const teamName: string = 'team'
  let factory: FactoryGirl
  const eventTimeline: string[] = []
  const eventTimelines: Array<string[]> = []
  const modules: TestingModule[] = []
  let libp2pNodeParams: Libp2pNodeParams[] = []
  const publicChannels: PublicChannel[] = []
  let timeToLastSync: number | undefined
  let inviteResult: InviteResult

  const initOrbitDb = async (i: number) => {
    const ipfsService = modules[i].get(IpfsService)
    const orbitDbService = modules[i].get(OrbitDbService)
    const channelsService = modules[i].get(ChannelsService)
    await orbitDbService.create(ipfsService.ipfsInstance!)
    await channelsService.init()
  }

  beforeAll(async () => {
    factory = await getBaseTypesFactory()
    modules.push(...(await spawnTestModules(N_PEERS)))
    const sigchainServiceA = await modules[0].resolve(SigChainService)

    // Create sigChain that all other peers will join
    await sigchainServiceA.createChain(teamName, 'user0', true)
    inviteResult = sigchainServiceA.getActiveChain().invites.createLongLivedUserInvite()

    // Initialize other chains with invite seed
    for (let i = 1; i < modules.length; i++) {
      // Create invitation from A -> B
      const sigchainService = await modules[i].resolve(SigChainService)
      await sigchainService.createChainFromInvite(`user${i}`, inviteResult.seed, sigchainServiceA.activeTeamId!, true)
    }

    // Create libp2p instances (in-memory transport)
    libp2pNodeParams = await spawnLibp2pInstancesInMemory(modules)
    // Initialize IPFS and OrbitDB instances
    await Promise.all(
      modules.map(async (module, i) => {
        const ipfsService = module.get(IpfsService)
        const libp2pService = module.get(Libp2pService)
        const localDbService = module.get(LocalDbService)
        await localDbService.open()
        await ipfsService.createInstance()
        await ipfsService.start()
        if (i === 0) {
          await initOrbitDb(i)
        }
        libp2pService.pauseDialQueue()
      })
    )
    // Attach event listeners to all libp2p service instances
    for (let i = 0; i < modules.length; i++) {
      eventTimelines[i] = []
      attachEventListeners(await modules[i].get(Libp2pService), eventTimeline, `${i}`)
      attachEventListeners(await modules[i].get(Libp2pService), eventTimelines[i], `${i}`)
    }
  })

  afterEach(async () => {
    // Clear event timelines
    eventTimeline.length = 0
    for (let i = 0; i < eventTimelines.length; i++) {
      eventTimelines[i].length = 0
    }
  })

  afterAll(async () => {
    // Stop all instances and close modules
    for (const module of modules) {
      const libp2pService = await module.resolve(Libp2pService)
      await libp2pService.close()
      await module.close()
    }
  })

  it('joins with an invitation', async () => {
    logger.info('joins with an invitation')
    const libp2pService = modules[0].get(Libp2pService)
    // Sequentially dial and wait for each peer to join
    for (let i = 1; i < modules.length; i++) {
      const peerLibp2pService = await modules[i].resolve(Libp2pService)
      await peerLibp2pService.dialPeer(libp2pService.localAddress)
      logger.info(`dialed peer ${i}`)
      // Wait for the peer to be connected (AUTH_JOINED)
      await new Promise<void>(resolve => {
        peerLibp2pService.once(Libp2pEvents.AUTH_JOINED, async () => {
          logger.info(`peer ${i} connected`)
          await initOrbitDb(i)
          resolve()
        })
      })
    }
  })

  it('merges graphs between all peers', async () => {
    logger.info('merges graphs between all peers')
    await new Promise<void>(resolve => {
      const resolveIfMet = async () => {
        // all peers should have the same graph head
        const heads: Hash[][] = []
        for (let i = 0; i < modules.length; i++) {
          const sigchainService = await modules[i].resolve(SigChainService)
          const head = sigchainService.getActiveChain().team?.graph.head
          if (head !== undefined) {
            heads.push(head)
            logger.info(`peer ${i} has head:`, head)
          }
        }
        if (heads.every(head => headsAreEqual(heads[0], head))) {
          logger.info('all peers have the same graph head')
          resolve()
        }
      }
      for (const libp2pService of modules.map(module => module.get(Libp2pService))) {
        libp2pService.on(Libp2pEvents.AUTH_UPDATED, () => {
          resolveIfMet()
        })
      }
      resolveIfMet()
    })
  }, 240_000)

  it('starts syncing channels for all peers', async () => {
    logger.info('starts syncing channels for all peers')
    await Promise.all(
      modules.map(async module => {
        const channelsService = module.get(ChannelsService)
        await channelsService.startSync()
      })
    )
  })

  it('creates a channel and syncs to peers', async () => {
    logger.info('waits for all peers to sync channels')
    const createChannel = async () => {
      const channelsService = modules[0].get(ChannelsService)
      const sigchainService = modules[0].get(SigChainService)
      const publicChannel = await factory.build<PublicChannel>('PublicChannel', {
        owner: sigchainService.user.userId,
      } as PublicChannel)
      publicChannels.push(publicChannel)
      const channel = await channelsService.createChannel(publicChannel)
      expect(channel).toBeDefined()
      const getChannels = await channelsService.getChannels()
      expect(getChannels.length).toBe(1)
      expect(getChannels[0].id).toBe(publicChannel.id)
    }
    await createChannel()
    await waitForExpect(
      async () => {
        expect(await channelsSynced(modules.map(module => module.get(ChannelsService)))).toBeTruthy()
      },
      5000,
      100
    )
  })

  it('sends a message from each peer and receives it on all peers', async () => {
    logger.info('sends a message from each peer and receives it on all peers')
    const messages: string[] = []
    // Define the message sending as a callback to be run after listeners are set up
    const sendMessagesFromAllPeers = async () => {
      for (let i = 0; i < modules.length; i++) {
        const message = await factory.build('ChannelMessage', {
          channelId: publicChannels[0].id,
        })
        messages.push(message.content)
        const channelsService = modules[i].get(ChannelsService)
        const channelStore = channelsService.channelsRepos.get(publicChannels[0].id)
        if (!channelStore) {
          throw new Error(`Channel store for channel ${publicChannels[0].id} not found on peer ${i}`)
        }
        await channelStore.store.sendMessage(message)
      }
    }

    timeToLastSync = await waitForSyncAndRun(
      modules.map(m => m.get(ChannelsService)),
      sendMessagesFromAllPeers,
      publicChannels[0].id,
      5_000
    )
    await waitForExpect(
      async () => {
        expect(
          await channelEntriesSynced(
            modules.map(module => module.get(ChannelsService)),
            publicChannels[0].id
          )
        ).toBe(true)
      },
      5000,
      100
    )

    await waitForExpect(
      async () => {
        for (let i = 0; i < modules.length; i++) {
          const channelsService = modules[i].get(ChannelsService)
          const channelStore = channelsService.channelsRepos.get(publicChannels[0].id)
          const entries = await channelStore?.store.getEntries()
          expect(entries?.length).toBe(N_PEERS)
        }
      },
      5000,
      100
    )
  })

  it('hangs up all peers', async () => {
    logger.info('hangs up all peers')
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('PEER_DISCONNECTED events did not occur within expected time.'))
      }, 10_000)
      const allDisconnected = async () => {
        if (timelinesInclude(eventTimelines.slice(1), Libp2pEvents.PEER_DISCONNECTED)) {
          clearTimeout(timeout)
          resolve()
        }
      }
      for (const libp2pService of modules.map(module => module.get(Libp2pService))) {
        libp2pService.once(Libp2pEvents.PEER_DISCONNECTED, () => {
          allDisconnected()
        })
      }
      modules[0].get(Libp2pService).hangUpPeers()
    })
    for (const module of modules) {
      const libp2pService = module.get(Libp2pService)
      expect(libp2pService.connectedPeers.size).toBe(0)
    }
  })

  it('creates a new channel and sends a message on the first peer', async () => {
    logger.info('creates a new channel and sends a message on the first peer')
    const channelsService = modules[0].get(ChannelsService)
    const sigchainService = modules[0].get(SigChainService)
    const newChannel = await factory.build<PublicChannel>('PublicChannel', {
      owner: sigchainService.user.userId,
    } as PublicChannel)
    publicChannels.push(newChannel)
    const channel = await channelsService.createChannel(newChannel)
    expect(channel).toBeDefined()
    const getChannels = await channelsService.getChannels()
    expect(getChannels.length).toBe(2)
    expect(getChannels[1].id).toBe(newChannel.id)

    // Send a message in the new channel
    const message = await factory.build('ChannelMessage', {
      channelId: newChannel.id,
    })
    const channelStore = channelsService.channelsRepos.get(newChannel.id)
    await channelStore!.store.sendMessage(message)

    await waitForExpect(
      async () => {
        const entries = await channelStore!.store.getEntries()
        expect(entries.length).toBe(1)
      },
      5000,
      100
    )
  })

  it('does not sync the new channel to other peers', async () => {
    logger.info('does not sync the new channel to other peers')
    // Wait for a short time to ensure no syncing happens
    await waitForSync(
      modules.map(m => m.get(ChannelsService)),
      undefined,
      timeToLastSync ?? 5_000
    )
    for (let i = 1; i < modules.length; i++) {
      const channelsService = modules[i].get(ChannelsService)
      const channels = await channelsService.getChannels()
      expect(channels.length).toBe(1) // Only the first channel should be present
      expect(channels[0].id).toBe(publicChannels[0].id)
    }
  })

  it('injects the new channel and message into peer 1', async () => {
    logger.info('injects the new channel and message into peer 1')
    const peer0IPFS = modules[0].get(IpfsService).ipfsInstance!
    const peer0Entries: LogEntry[] = []
    for await (const entry of peer0IPFS.blockstore.getAll()) {
      const decoded = await Entry.decode(entry.block)
      if (decoded.id && decoded.id.startsWith('/orbitdb/')) {
        peer0Entries.push(decoded)
      }
    }
    logger.info(
      'Entries to inject into peer 1:',
      peer0Entries.map(e => ({ id: e.id, hash: e.hash }))
    )
    const peer1OrbitDbService = modules[1].get(OrbitDbService)
    await peer1OrbitDbService.ingestEntries(peer0Entries)

    const channelsService = modules[1].get(ChannelsService)
    expect((await channelsService.getChannels()).length).toBe(2)

    await waitForExpect(
      async () => {
        expect(await channelEntriesSynced([modules[0].get(ChannelsService), modules[1].get(ChannelsService)])).toBe(
          true
        )
      },
      1000,
      100
    )

    await waitForExpect(
      async () => {
        expect(await channelsSynced(modules.map(module => module.get(ChannelsService)))).toBe(false)
      },
      1000,
      100
    )
    await waitForExpect(
      async () => {
        expect(
          await channelEntriesSynced(
            modules.map(module => module.get(ChannelsService)),
            publicChannels[1].id
          )
        ).toBe(false)
      },
      1000,
      100
    )
  })

  it('creates a brand new peer, fully disconnected', async () => {
    logger.info('creates a new peer, gets channels from qss mock, fails to decrypt, then joins and reindexes')
    const newPeerModule = await spawnTestModules(1)
    expect(newPeerModule.length).toBe(1)
    modules.push(newPeerModule[0])
    const sigchainService = await modules[N_PEERS].resolve(SigChainService)
    /**
     * This is kind of janky but this is what is happening and why:
     *
     * With the introduction of LFA-based identity in OrbitDB you need an initialized sigchain (with a joined team) to
     * be able to generate/validate identity objects.  Under normal circumstances we don't create/initialize our instance
     * of OrbitDB until after joining the sigchain so to simulate the behavior of having OrbitDB data without the ability
     * to decrypt is to manually pseudo-join^ the chain and then properly join using the invite in the later step where we get the
     * ability to decrypt.
     *
     * ^What does pseudo-joining mean?  Basically we are doing the steps performed by the LFA connection when admitting a member
     * and manually udpating everyone's team graphs to match the new user's since they're the only one that has their device on it.
     * Once the new user connects to a peer over libp2p they will be able to authenticate and the existing peer will add the 'member'
     * role so they can decrypt records in OrbitDB.
     */
    const username = `user${N_PEERS}`
    const adminSigchainService = modules[0].get(SigChainService)
    const sigchain = await sigchainService.createChainFromInvite(
      username,
      inviteResult.seed,
      adminSigchainService.activeTeamId!,
      true
    )
    const proof = generateProof(inviteResult.seed)
    adminSigchainService.activeChain.team!.admitMember(proof, redactKeys(sigchain.context.user.keys), username)
    const teamBytes = adminSigchainService.activeChain.save()
    const teamKeyring = adminSigchainService.activeChain.team!.teamKeyring()
    expect(teamKeyring).toBeDefined()
    const userContext = {
      device: sigchain.context.device,
      user: sigchain.context.user,
    }
    const loadedTeam = new Team({
      source: teamBytes,
      context: userContext,
      teamKeyring,
    })
    loadedTeam.join(teamKeyring)
    sigchain.context = {
      ...userContext,
      team: loadedTeam,
    }
    const newUser = sigchain.users.getUserByName(username)
    expect(newUser).toBeDefined()
    expect(newUser!.keys.encryption).toBe(sigchain.context.user.keys.encryption.publicKey)

    // Create libp2p instances (in-memory transport)
    libp2pNodeParams = await spawnLibp2pInstancesInMemory(newPeerModule)

    const ipfsService = modules[N_PEERS].get(IpfsService)
    const orbitDbService = modules[N_PEERS].get(OrbitDbService)
    const libp2pService = modules[N_PEERS].get(Libp2pService)
    const channelsService = modules[N_PEERS].get(ChannelsService)
    const localDbService = modules[N_PEERS].get(LocalDbService)
    await localDbService.open()
    await ipfsService.createInstance()
    await ipfsService.start()
    await orbitDbService.create(ipfsService.ipfsInstance!)
    await channelsService.init()

    libp2pService.pauseDialQueue()
    eventTimelines[N_PEERS] = []
    attachEventListeners(await modules[N_PEERS].get(Libp2pService), eventTimeline, `${N_PEERS}`)
    attachEventListeners(await modules[N_PEERS].get(Libp2pService), eventTimelines[N_PEERS], `${N_PEERS}`)
  })

  it(`merge new user's graph into the other sigchains`, async () => {
    logger.info(`merge new user's graph into the other sigchains`)
    const newestSigchainService = modules[N_PEERS].get(SigChainService)
    const newestGraph = newestSigchainService.team.graph
    for (let i = 0; i < modules.length - 1; i++) {
      logger.info(`peer ${i} merging graph`)
      const sigchainService = await modules[i].resolve(SigChainService)
      sigchainService.team.merge(newestGraph)
    }
    // all peers should have the same graph head
    const heads: Hash[][] = []
    for (let i = 0; i < modules.length; i++) {
      const sigchainService = await modules[i].resolve(SigChainService)
      const head = sigchainService.getActiveChain().team?.graph.head
      if (head !== undefined) {
        heads.push(head)
        logger.info(`peer ${i} has head:`, head)
      }
    }
    if (heads.every(head => headsAreEqual(heads[0], head))) {
      logger.info('all peers have the same graph head')
    } else {
      logger.error('failed to merge graphs!')
      throw new Error('failed to merge graphs!')
    }
  }, 240_000)

  it('injects entries into new peer and cannot decrypt them', async () => {
    logger.info('injects entries into new peer and cannot decrypt them')
    const peer0IPFS = modules[0].get(IpfsService).ipfsInstance!
    const peer0Entries: LogEntry[] = []
    for await (const entry of peer0IPFS.blockstore.getAll()) {
      const decoded = await Entry.decode(entry.block)
      if (decoded.id && decoded.id.startsWith('/orbitdb/')) {
        peer0Entries.push(decoded)
      }
    }
    logger.info(
      'Entries to inject into new peer:',
      peer0Entries.map(e => ({ id: e.id, hash: e.hash }))
    )
    const newPeerOrbitDbService = modules[N_PEERS].get(OrbitDbService)
    const newPeerChannelsService = modules[N_PEERS].get(ChannelsService)
    expect(newPeerOrbitDbService).toBeDefined()
    // new peer has no channels yet
    expect((await newPeerChannelsService.getChannels()).length).toBe(0)
    await newPeerOrbitDbService.ingestEntries(peer0Entries)

    // new peer cannot decrypt the entries
    expect((await newPeerChannelsService.getChannels()).length).toBe(0)

    // new peer has entries in its blockstore
    const newPeerIPFS = modules[N_PEERS].get(IpfsService).ipfsInstance!
    const newPeerEntries: LogEntry[] = []
    for await (const entry of newPeerIPFS.blockstore.getAll()) {
      const decoded = await Entry.decode(entry.block)
      if (decoded.id && decoded.id.startsWith('/orbitdb/')) {
        newPeerEntries.push(decoded)
      }
    }
    expect(newPeerEntries.length).toBe(peer0Entries.length)
  })

  it('connects to the existing network and reindexes', async () => {
    // new peer connects to original peer
    const libp2pService = modules[N_PEERS].get(Libp2pService)
    await libp2pService.dialPeer(modules[0].get(Libp2pService).localAddress)
    // Wait for the peer to be connected (AUTH_JOINED)
    await new Promise<void>(resolve => {
      libp2pService.once(Libp2pEvents.AUTH_CONNECTED, async () => {
        logger.info(`peer ${N_PEERS} connected`)
        resolve()
      })
    })

    await Promise.all(
      modules.map(async module => {
        const channelsService = module.get(ChannelsService)
        await channelsService.startSync()
      })
    )

    await waitForExpect(
      async () => {
        expect(await channelsSynced([modules[0].get(ChannelsService), modules[N_PEERS].get(ChannelsService)])).toBe(
          true
        )
      },
      10000,
      1000
    )
    // new peer should eventually show the same channels and messages as the original peer
    await waitForExpect(
      async () => {
        expect(
          await channelEntriesSynced([modules[0].get(ChannelsService), modules[N_PEERS].get(ChannelsService)])
        ).toBe(true)
      },
      10000,
      1000
    )
  })
})
