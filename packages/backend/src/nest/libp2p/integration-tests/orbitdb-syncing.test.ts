import { jest } from '@jest/globals'
import { Entry, LogType } from '@orbitdb/core'

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
import { EventStoreBase } from '../../storage/base.store'
import { EventsWithStorage } from '../../storage/orbitDb/eventsWithStorage'
import { IPFSAccessController } from '@orbitdb/core'
import { all } from '../../websocketOverTor/filters'

const logger = createLogger('libp2p:orbitdb-syncing.test')

const logHeads = async (store: any) => {
  const heads = await store.log.heads()
  // log everything but "bytes"
  logger.info(
    `Heads for ${store.id}:`,
    heads.map((h: any) => ({ ...h, bytes: undefined }))
  )
  return heads
}

class MockOrbitDBStore extends EventStoreBase<any> {
  public orbitDbService: OrbitDbService
  public store: any
  public peerId: string
  public id: string

  get Store() {
    return this.getStore()
  }

  get log(): LogType {
    return this.store.log
  }

  constructor(orbitDbService: OrbitDbService, options?: any) {
    super()
    this.orbitDbService = orbitDbService
    this.peerId = options?.peerId ?? orbitDbService.orbitDb.peerId
    this.id = options?.id ?? orbitDbService.orbitDb.id
  }

  public async init() {
    // Mock initialization logic
    this.store = await this.orbitDbService.orbitDb.open<any>('mock-store', {
      type: 'events',
      Database: EventsWithStorage(),
      AccessController: IPFSAccessController({ write: ['*'] }),
      sync: false,
    })
  }

  public async startSync() {
    await this.Store.sync.start()
  }

  public async stopSync() {
    await this.Store.sync.stop()
  }

  public async addEntry(value: any): Promise<string> {
    return await this.Store.add(value)
  }

  public async getEntries(): Promise<any[]> {
    const entries: any[] = []
    for await (const entry of this.Store.iterator()) {
      entries.push(entry)
    }
    return entries
  }

  public async clean() {
    // Mock closing logic
  }
}

/**
 * Helper to check if all peers have the same set of entries (by hash) and expected count.
 * Returns true if all peers are synced, false otherwise.
 */
async function entriesAreSynced(stores: MockOrbitDBStore[], expectedCount?: number): Promise<boolean> {
  const allEntries: Map<number, any[]> = new Map()
  for (let i = 0; i < stores.length; i++) {
    const entries = await stores[i].getEntries()
    allEntries.set(i, entries)
  }

  // Find the peer with the most entries to use as the reference
  let referenceIndex = 0
  let maxEntries = 0
  for (const [i, entries] of allEntries.entries()) {
    if (entries.length > maxEntries) {
      maxEntries = entries.length
      referenceIndex = i
    }
  }
  const referenceEntries = allEntries.get(referenceIndex) ?? []
  const referenceHashes = new Set(referenceEntries.map(e => e.hash))

  let allEqual = true
  for (let i = 0; i < allEntries.size; i++) {
    if (i === referenceIndex) continue
    const entries = allEntries.get(i)!
    logger.info(`Entries for peer ${stores[i].id}:`, entries)
    if (expectedCount !== undefined && entries.length !== expectedCount) {
      logger.error(`Peer ${stores[i].id} does not have expected number of entries ${expectedCount}`)
      allEqual = false
    }
    const hashes = new Set(entries.map(e => e.hash))
    if (hashes.size !== referenceHashes.size) {
      logger.error(
        `Peer ${stores[i].id}} hash set size mismatch (has ${hashes.size}, expected ${referenceHashes.size})`
      )
      // Log which hashes are missing
      const missing = [...referenceHashes].filter(h => !hashes.has(h))
      if (missing.length > 0) {
        logger.error(`Peer ${stores[i].id} is missing hashes:`, missing)
        logger.info(`Peer ${stores[i].id} hashes:`, [...hashes])
      }
      allEqual = false
    }
    for (const hash of referenceHashes) {
      if (!hashes.has(hash)) {
        logger.error(`Peer ${stores[i].id}} missing hash ${hash}`)
        allEqual = false
      }
    }
  }
  if (allEqual) {
    return true
  }
  logger.warn('Not all peers are synced')
  return false
}

/**
 * Alternate helper to check if all peers have every entry seen by any peer (union of all hashes).
 * Returns true if every store has every hash seen in any store, false otherwise.
 */
async function entriesAreFullyUnioned(stores: MockOrbitDBStore[], expectedCount?: number): Promise<boolean> {
  const allEntries: Map<number, any[]> = new Map()
  for (let i = 0; i < stores.length; i++) {
    const entries = await stores[i].getEntries()
    allEntries.set(i, entries)
  }

  // Create a set of all hashes seen in any store
  const allHashes = new Set<string>()
  for (const entries of allEntries.values()) {
    for (const entry of entries) {
      allHashes.add(entry.hash)
    }
  }

  let allHaveAll = true
  for (let i = 0; i < stores.length; i++) {
    const entries = allEntries.get(i) || []
    const hashes = new Set(entries.map(e => e.hash))
    for (const hash of allHashes) {
      if (!hashes.has(hash)) {
        logger.error(`Peer ${stores[i].id} is missing hash: ${hash}`)
        allHaveAll = false
      }
    }
    if (expectedCount !== undefined && entries.length !== expectedCount) {
      logger.error(`Peer ${stores[i].id} does not have expected number of entries ${expectedCount}`)
      allHaveAll = false
    }
  }
  if (allHaveAll) {
    return true
  }
  logger.warn('Not all peers have all entries in the union set')
  return false
}

/**
 * Waits for all stores to sync entries (by hash) to the expected count or until all peers have the same set of hashes.
 * Resolves when synced or after timeout.
 * Optionally takes a callback to run after setting up the update listeners.
 */
async function waitForEntriesToSync(
  stores: MockOrbitDBStore[],
  expectedCount?: number,
  timeoutMs = 5000,
  afterListenersSetup?: () => Promise<void> | void
): Promise<void> {
  return new Promise<void>(resolve => {
    const timeout = setTimeout(() => {
      logger.error('Syncing timed out')
      resolve()
    }, timeoutMs)

    let resolved = false
    const maybeResolve = async () => {
      logger.info('A store updated, checking if all entries are synced...')
      if (resolved) return
      if (await entriesAreFullyUnioned(stores, expectedCount)) {
        clearTimeout(timeout)
        resolved = true
        resolve()
      }
    }

    // Listen for 'update' events on all stores
    for (const store of stores) {
      store.Store.events.on('update', maybeResolve)
    }

    // Optionally run the callback after listeners are set up
    if (afterListenersSetup) {
      Promise.resolve(afterListenersSetup()).catch(err => logger.error('Error in afterListenersSetup:', err))
    }

    // Also poll every second in case events are missed
    const poll = setInterval(maybeResolve, 1000)
    timeout.unref?.()
    setTimeout(() => clearInterval(poll), timeoutMs)
  })
}

const N_PEERS = 4
jest.setTimeout(120_000)
describe(`OrbitDB Syncing with ${N_PEERS} peers`, () => {
  const teamName: string = 'team'
  const eventTimeline: string[] = []
  const eventTimelines: Array<string[]> = []
  const modules: TestingModule[] = []
  let libp2pNodeParams: Libp2pNodeParams[] = []
  const mockStores: MockOrbitDBStore[] = []

  beforeAll(async () => {
    modules.push(...(await spawnTestModules(N_PEERS)))
    const sigchainServiceA = await modules[0].resolve(SigChainService)

    // Create sigChain that all other peers will join
    await sigchainServiceA.createChain(teamName, 'user0', true)
    const inviteResult = sigchainServiceA.getActiveChain().invites.createLongLivedUserInvite()

    // Initialize other chains with invite seed
    for (let i = 1; i < modules.length; i++) {
      // Create invitation from A -> B
      const sigchainService = await modules[i].resolve(SigChainService)
      await sigchainService.createChainFromInvite(`user${i}`, teamName, inviteResult.seed, true)
    }

    // Create libp2p instances (in-memory transport)
    libp2pNodeParams = await spawnLibp2pInstancesInMemory(modules)
    // Initialize IPFS and OrbitDB instances
    await Promise.all(
      modules.map(async (module, i) => {
        const ipfsService = module.get(IpfsService)
        const orbitDbService = module.get(OrbitDbService)
        const libp2pService = module.get(Libp2pService)
        await ipfsService.createInstance()
        await ipfsService.start()
        await orbitDbService.create(libp2pNodeParams[i].peerId.peerId, ipfsService.ipfsInstance!)
        const mockStore = new MockOrbitDBStore(orbitDbService, {
          peerId: libp2pNodeParams[i].peerId.peerId.toString(),
          id: 'peer' + i,
        })
        await mockStore.init()
        mockStores.push(mockStore)
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
        peerLibp2pService.once(Libp2pEvents.AUTH_JOINED, () => {
          logger.info(`peer ${i} connected`)
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

  it('owner gracefully disconnects with all peers', async () => {
    logger.info('gracefully disconnects')
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
  })

  it('adds an initial entry to the mock store for all peers', async () => {
    logger.info('adds an initial entry to the mock store for all peers')
    await Promise.all(
      mockStores.map(async (mockStore, i) => {
        const entry = { peerId: mockStore.peerId, value: `Hello from peer ${mockStore.id}` }
        await mockStore.addEntry(entry)
        logger.info(`Added entry to peer ${mockStore.id}:`, entry)
      })
    )
    for (let i = 0; i < mockStores.length; i++) {
      const entries = await mockStores[i].getEntries()
      logger.info(`Entries for peer ${mockStores[i].id}:`, entries)
      expect(entries.length).toBe(1)
    }
  })

  it('all peers dial each other', async () => {
    logger.info('all peers dial each other')
    await Promise.all(
      modules.map(async (module, i) => {
        const libp2pService = module.get(Libp2pService)
        for (let j = 0; j < modules.length; j++) {
          if (i !== j) {
            await libp2pService.dialPeer(modules[j].get(Libp2pService).localAddress)
          }
        }
      })
    )
    // Wait for all peers to be connected
    await new Promise<void>(resolve => {
      const resolveIfMet = async () => {
        const isConnectedToAll = (peer: Libp2pService) => {
          return peer.connectedPeers.size === modules.length - 1
        }
        if (modules.map(module => isConnectedToAll(module.get(Libp2pService))).every(Boolean)) {
          resolve()
        }
      }
      for (const libp2pService of modules.slice(1).map(module => module.get(Libp2pService))) {
        libp2pService.once(Libp2pEvents.AUTH_CONNECTED, () => {
          resolveIfMet()
        })
      }
      resolveIfMet()
    })
  })

  it('verifies all peers are connected', async () => {
    logger.info('verifies all peers are connected')
    for (let i = 0; i < modules.length; i++) {
      const libp2pService = modules[i].get(Libp2pService)
      expect(libp2pService.connectedPeers.size).toBe(modules.length - 1)
    }
  })

  it('turns on syncing for all peers', async () => {
    logger.info('turns on syncing for all peers')
    await Promise.all(
      mockStores.map(async (mockStore, i) => {
        logger.info(`Syncing starting for peer ${i}`)
        await mockStore.startSync()
      })
    )
  })

  it('syncs entries between all peers', async () => {
    logger.info('syncs entries between all peers')

    await waitForEntriesToSync(mockStores, undefined, 5000, async () => {
      await mockStores[0].addEntry({
        peerId: mockStores[0].peerId,
        value: `Hello from peer ${mockStores[0].id} (added after sync started)`,
      })
    })

    expect(await entriesAreFullyUnioned(mockStores)).toBe(true)
    logger.info('All entries are synced between peers')
  })

  it('logs heads after syncing', async () => {
    logger.info('logs heads after syncing')
    for (let i = 0; i < mockStores.length; i++) {
      await logHeads(mockStores[i])
    }
  })

  it('adds a new entry to peer 0 and expects all peers to make that their head', async () => {
    logger.info('adds a new entry to peer 0 and expects all peers to make that their head')
    const newEntry = {
      peerId: libp2pNodeParams[0].peerId.peerId.toString(),
      value: 'This should be the new head',
    }
    await mockStores[0].addEntry(newEntry)
    logger.info(`Added entry to peer 0:`, newEntry)

    await waitForEntriesToSync(mockStores, (await mockStores[0].getEntries()).length)
    expect(await entriesAreFullyUnioned(mockStores, (await mockStores[0].getEntries()).length)).toBe(true)

    // expect all peers to have the same head
    const headsList = await Promise.all(mockStores.map(store => store.log.heads()))
    logger.info('New heads for all peers:', headsList)
    const referenceHeads = headsList[0]
    expect(referenceHeads.length).toEqual(1)
    for (let i = 1; i < headsList.length; i++) {
      expect(headsList[i].length).toBe(referenceHeads.length)
    }
  })

  it('stops syncing for all peers', async () => {
    logger.info('stops syncing for all peers')
    await Promise.all(
      mockStores.map(async (mockStore, i) => {
        logger.info(`Syncing stopping for peer ${i}`)
        await mockStore.stopSync()
      })
    )
  })

  it('adds a new entry to peer 0 and expects all peers to not sync it', async () => {
    logger.info('adds a new entry to peer 0 and expects all peers to not sync it')
    const newEntry = {
      peerId: libp2pNodeParams[0].peerId.peerId.toString(),
      value: 'This should NOT be synced',
    }
    await mockStores[0].addEntry(newEntry)
    logger.info(`Added entry to peer 0:`, newEntry)

    await new Promise<void>(resolve => {
      setTimeout(async () => {
        // Check if all peers have the same number of entries
        const entryCounts = await Promise.all(mockStores.map(store => store.getEntries()))
        logger.info('Entry counts for all peers:', entryCounts)
        expect(entryCounts.every(count => count.length === entryCounts[0].length)).toBe(false)
        resolve()
      }, 5000)
    })
  })

  it('injects the entry manually into peer 1', async () => {
    logger.info('injects the entry manually into peer 1')
    const head = (await mockStores[0].log.heads())[0]
    const entry = await Entry.decode(head.bytes)
    logger.info('Entry to inject:', entry)
    await mockStores[1].log.joinEntry(entry)
    logger.info(`Injected entry into peer 1:`, entry)
    const peer0Entries = await mockStores[0].getEntries()
    const peer1Entries = await mockStores[1].getEntries()
    logger.info('Entries for peer 0:', peer0Entries)
    logger.info('Entries for peer 1:', peer1Entries)
    expect(peer0Entries.length).toBe(peer1Entries.length)
    const peer0Heads = await mockStores[0].log.heads()
    const peer1Heads = await mockStores[1].log.heads()
    logger.info('Heads for peer 0:', peer0Heads)
    logger.info('Heads for peer 1:', peer1Heads)
    expect(peer0Heads.length).toBe(peer1Heads.length)
    expect(await entriesAreFullyUnioned([mockStores[0], mockStores[1]])).toBe(true)
  })

  it('does not break when peers 0 and 1 start syncing again', async () => {
    logger.info('does not break when peers 0 and 1 start syncing again')
    await Promise.all([mockStores[0].startSync(), mockStores[1].startSync()])
    logger.info('Syncing started for peers 0 and 1')
    await waitForEntriesToSync(mockStores, undefined, 2000)
    logger.info('Entries synced')
    expect(await entriesAreFullyUnioned([mockStores[0], mockStores[1]])).toBe(true)
  })

  it('simulates a conversation between peers 0 and 1', async () => {
    logger.info('simulates a conversation between peers 0 and 1')
    const conversationEntries = [
      { peerId: libp2pNodeParams[0].peerId.peerId.toString(), value: 'Multipart 1' },
      { peerId: libp2pNodeParams[0].peerId.peerId.toString(), value: 'Multipart 2' },
      { peerId: libp2pNodeParams[0].peerId.peerId.toString(), value: 'Multipart 3' },
      // { peerId: libp2pNodeParams[1].peerId.peerId.toString(), value: 'I am fine, thanks!' },
    ]
    for (const entry of conversationEntries) {
      if (entry.peerId === libp2pNodeParams[0].peerId.peerId.toString()) {
        await mockStores[0].addEntry(entry)
      }
      if (entry.peerId === libp2pNodeParams[1].peerId.peerId.toString()) {
        await mockStores[1].addEntry(entry)
      }
    }
    logger.info('Added conversation entries to peers 0 and 1')
    await waitForEntriesToSync([mockStores[0], mockStores[1]])
    expect(await entriesAreFullyUnioned([mockStores[0], mockStores[1]])).toBe(true)
  })

  it('injects just the head into peer 2 and peer 2 retrieves the rest with bitswap', async () => {
    logger.info('injects just the head into peer 2')
    const heads = await mockStores[0].log.heads()
    logger.info('Peer0 Heads:', heads)
    expect(heads.length).toBe(1)
    const head = heads[0]
    const peer2EntriesBeforeInjection = await mockStores[2].getEntries()
    logger.info('Entries for peer 2 before injection:', peer2EntriesBeforeInjection)
    // Inject the entry into peer 2
    const entry = await Entry.decode(head.bytes)
    logger.info('Entry to inject:', entry)
    await mockStores[2].log.joinEntry(entry)
    await waitForEntriesToSync([mockStores[0], mockStores[2]])
    logger.info(`Injected entry into peer 2:`, entry)
    const peer2Entries = await mockStores[2].getEntries()
    logger.info('Entries for peer 2:', peer2Entries)
    expect(await entriesAreFullyUnioned([mockStores[0], mockStores[2]])).toBe(true)
  })

  it('hangs up all peers for peer 3', async () => {
    logger.info('hangs up all peers for peer 3')
    const libp2pService = modules[3].get(Libp2pService)
    await libp2pService.hangUpPeers()
    // Wait for all peers to be disconnected
    await new Promise<void>(resolve => {
      const resolveIfMet = async () => {
        if (modules[3].get(Libp2pService).connectedPeers.size === 0) {
          resolve()
        }
      }
      modules[3].get(Libp2pService).once(Libp2pEvents.PEER_DISCONNECTED, () => {
        resolveIfMet()
      })
      resolveIfMet()
    })
  })
  it('inject just the head into peer 3 and expects it to stall', async () => {
    logger.info('inject just the head into peer 3 and expects it to stall')
    const head = (await mockStores[0].log.heads())[0]
    const peer0Entries = await mockStores[0].getEntries()
    await Promise.all(
      modules
        .filter((_, i) => i !== 3)
        .map(async module => {
          const libp2pService = module.get(Libp2pService)
          await libp2pService.close(false)
        })
    )
    const peer3EntriesBeforeInjection = await mockStores[3].getEntries()
    logger.info('Entries for peer 3 before injection:', peer3EntriesBeforeInjection)
    const entry = await Entry.decode(head.bytes)
    logger.info('Entry to inject:', entry)
    await mockStores[3].log.joinEntry(entry)
    logger.info(`Injected entry into peer 3:`, entry)
    waitForEntriesToSync([mockStores[3]], peer0Entries.length, 5000)
    const peer3Entries = await mockStores[3].getEntries()
    logger.info('Entries for peer 3 after injection:', peer3Entries)
    expect(peer3Entries.length).toBe(peer3EntriesBeforeInjection.length + 1)
  })

  // it('poisons the graph', async () => {
  //   logger.info('poisons the graph')
  //   const head = (await mockStores[0].log.heads())[0]
  //   // Poison the graph by adding an entry with a non-existant ancestor
  //   logger.info('Poisoning entry:', head)
  //   const poisonedEntry = {
  //     ...head,
  //     next: ['w' + (head.next[0] as string).slice(1)],
  //   }
  //   // set up listeners for each store to see if they detect the poisoned entry
  //   const sawEntry: string[] = []
  //   for (let i = 0; i < mockStores.length; i++) {
  //     const mockStore = mockStores[i]
  //     mockStore.Store.events.on('update', async () => {
  //       logger.info(`Peer ${i} updated`)
  //       const heads = await mockStore.log.heads()
  //       logger.info(`Heads from peer ${i}:`, heads)
  //       sawEntry.push(mockStore.id)
  //     })
  //   }
  //   await mockStores[0].Store.sync.add(poisonedEntry)

  //   await new Promise<void>(resolve => {
  //     setTimeout(() => {
  //       logger.info('Saw entry:', sawEntry)
  //       expect(sawEntry.length).toBe(mockStores.length)
  //       resolve()
  //     }, 5000)
  //   })
  // })

  // it('turns on syncing for all peers again and waits for each db to update', async () => {
  //   logger.info('turns on syncing for all peers again')
  //   // setup listeners for each store
  //   for (let i = 0; i < mockStores.length; i++) {
  //     const mockStore = mockStores[i]
  //     mockStore.Store.events.on('update', async () => {
  //       logger.info(`Peer ${i} updated`)
  //       const heads = await mockStore.log.heads()
  //       logger.info(`Heads from peer ${i}:`, heads)
  //     })
  //   }
  // })

  // it('logs heads after syncing', async () => {
  //   logger.info('logs heads')
  //   for (let i = 0; i < mockStores.length; i++) {
  //     await logHeads(mockStores[i])
  //   }
  // })

  it.skip('initializes a new peer and injects the most recent n-1 entries', async () => {
    logger.info('initializes a new peer')
    const newPeerIndex = mockStores.length
    const newModules = await spawnTestModules(1)
    modules.push(newModules[0])
    const newLibp2pService = newModules[0].get(Libp2pService)
    const newLibp2pParams = await spawnLibp2pInstancesInMemory(newModules)
    libp2pNodeParams.push(newLibp2pParams[0])
    newLibp2pService.createInstance(newLibp2pParams[0])
    newLibp2pService.pauseDialQueue()
    const newIpfsService = newModules[0].get(IpfsService)
    const newOrbitDbService = newModules[0].get(OrbitDbService)
    await newIpfsService.createInstance()
    await newIpfsService.start()
    await newOrbitDbService.create(newLibp2pParams[0].peerId.peerId, newIpfsService.ipfsInstance!)
    const mockStore = new MockOrbitDBStore(newOrbitDbService, {
      peerId: newLibp2pParams[0].peerId.peerId.toString(),
      id: 'peer' + newPeerIndex,
    })
    await mockStore.init()
    mockStores.push(mockStore)

    const nMinus1Entries = (await mockStores[0].getEntries()).length - 1
    const heads = await mockStores[0].log.heads()
    const decodedHeads = await Promise.all(
      heads.map(async (head: any) => {
        const decodedHead = await Entry.decode(head.bytes)
        logger.info(`Decoded head for peer ${newPeerIndex}:`, decodedHead)
        return decodedHead
      })
    )
    // logger.info('Heads to Inject:', decodedHeads)
    for (const head of decodedHeads) {
      logger.info(`Injecting head to new peer:`, head)
      const updated = await mockStore.log.joinEntry(head)
      logger.info('Joined entry:', updated)
    }
    logger.info('New peers entries:', await mockStore.getEntries())
    // Wait for the new peer to sync
    // const entries = await mockStores[0].getEntries()
    // const entriesToInject = entries.slice(0, nMinus1Entries)
    // for (const entry of entriesToInject) {
    //   logger.info(`Injecting entry to new peer:`, entry)
    // }
  })
})
