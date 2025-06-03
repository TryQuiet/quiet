import { jest } from '@jest/globals'
import { Entry, LogEntry, LogType } from '@orbitdb/core'

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
import { ChannelStore } from '../../storage/channels/channel.store'
import { ChannelSubscribedPayload, PublicChannel } from '@quiet/types'
import { getBaseTypesFactory } from '@quiet/state-manager'
import { FactoryGirl } from 'factory-girl'
import waitForExpect from 'wait-for-expect'
import { StorageEvents } from '../../storage/storage.types'

const logger = createLogger('libp2p:orbitdb-message-fanout.test')

const logHeads = async (store: any) => {
  const heads = await store.log.heads()
  // log everything but "bytes"
  logger.info(
    `Heads for ${store.id}:`,
    heads.map((h: any) => ({ ...h, bytes: undefined }))
  )
  return heads
}

/**
 * Performs a deep, order-insensitive equality check between two arrays.
 * If an item has a 'hash' property, uses that as the comparison key; otherwise, uses JSON stringification.
 *
 * @param arr1 - The first array to compare.
 * @param arr2 - The second array to compare.
 * @returns True if arrays are deeply equal (order-insensitive), false otherwise.
 */
function deepArrayEqual(arr1: any[], arr2: any[]): boolean {
  if (arr1.length !== arr2.length) return false
  // Prefer hash if present, else use JSON
  const getKey = (item: any) => (item && typeof item === 'object' && 'hash' in item ? item.hash : JSON.stringify(item))
  const set1 = new Set(arr1.map(getKey))
  const set2 = new Set(arr2.map(getKey))
  if (set1.size !== set2.size) return false
  for (const key of set1) {
    if (!set2.has(key)) return false
  }
  return true
}

/**
 * Checks if all ChannelStores have the union of all entry hashes seen by any store.
 * Optionally checks that each store has the expected number of entries.
 *
 * @param stores - Array of ChannelStore instances to check.
 * @param expectedCount - Optional expected number of entries per store.
 * @returns True if all stores have all entries, false otherwise.
 */
async function entriesAreFullyUnioned(stores: ChannelStore[], expectedCount?: number): Promise<boolean> {
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
        logger.error(`Peer ${i} is missing hash: ${hash}`)
        allHaveAll = false
      }
    }
    if (expectedCount !== undefined && entries.length !== expectedCount) {
      logger.error(`Peer ${i} does not have expected number of entries ${expectedCount}`)
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
 * Checks if all ChannelsService instances have the same set of channels, and that each channel is identical across services.
 *
 * @param services - Array of ChannelsService instances to check.
 * @returns True if all services have the same channels, false otherwise.
 */
async function channelsSynced(services: ChannelsService[]): Promise<boolean> {
  const channelMap: Map<string, PublicChannel[]> = new Map()
  for (const service of services) {
    const serviceChannels = await service.getChannels()
    for (const channel of serviceChannels) {
      if (!channelMap.has(channel.id)) {
        channelMap.set(channel.id, [])
      }
      channelMap.get(channel.id)?.push(channel)
    }
  }
  // Check if all services have the same channels
  for (const [id, channels] of channelMap.entries()) {
    if (channels.length !== services.length) {
      logger.error(`Channel ${id} is missing in some services: ${channels.length} found, expected ${services.length}`)
      return false
    }
    const firstChannel = channels[0]
    for (const channel of channels) {
      if (!deepArrayEqual([channel], [firstChannel])) {
        logger.error(`Channel ${id} differs between services`)
        return false
      }
    }
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
  // Map of channelId to array of entries from each service
  const channelEntriesMap: Map<string, any[][]> = new Map()

  // Gather all channels from all services
  for (const service of services) {
    const channels = await service.getChannels()
    for (const channel of channels) {
      if (channelId && channel.id !== channelId) continue
      if (!channelEntriesMap.has(channel.id)) {
        channelEntriesMap.set(channel.id, [])
      }
      // Get entries for this channel from this service
      // Use the ChannelStore from publicChannelsRepos
      const repo = service.publicChannelsRepos.get(channel.id)
      if (!repo) {
        logger.error(`No repo for channel ${channel.id} in service`)
        channelEntriesMap.get(channel.id)!.push([])
        continue
      }
      const entries = await repo.store.getEntries()
      channelEntriesMap.get(channel.id)!.push(entries)
    }
  }

  // For each channel, check that all services have the same entries
  for (const [id, entriesLists] of channelEntriesMap.entries()) {
    if (entriesLists.length !== services.length) {
      logger.error(
        `Channel ${id} is missing in some services: ${entriesLists.length} found, expected ${services.length}`
      )
      return false
    }
    // Compare entries for all services using deepArrayEqual
    const reference = entriesLists[0]
    for (let i = 1; i < entriesLists.length; i++) {
      if (!deepArrayEqual(entriesLists[i], reference)) {
        logger.error(`Entries for channel ${id} differ between services`)
        return false
      }
    }
  }
  return true
}

/**
 * Waits for all channels and their entries to sync across all services (optionally for a specific channel).
 * Resolves with the time (ms) it took to sync, or undefined if timed out.
 * Optionally takes a callback to run after setting up the update listeners.
 *
 * @param services - Array of ChannelsService instances to monitor.
 * @param channelId - Optional channel ID to restrict the sync check.
 * @param timeoutMs - Timeout in milliseconds before giving up.
 * @param afterListenersSetup - Optional callback to run after listeners are set up.
 * @returns Promise that resolves with sync time in ms, or undefined if timeout is reached.
 */
async function waitForChannelsAndEntriesToSync(
  services: ChannelsService[],
  channelId?: string,
  timeoutMs = 5000,
  afterListenersSetup?: () => Promise<void> | void
): Promise<number | undefined> {
  return new Promise<number | undefined>(resolve => {
    const start = Date.now()
    const timeout = setTimeout(() => {
      logger.error('Channel/entry syncing timed out')
      cleanup()
      resolve(undefined)
    }, timeoutMs)

    let resolved = false
    function cleanup() {
      clearTimeout(timeout)
      clearInterval(poll)
    }

    const maybeResolve = async () => {
      logger.info('A channel or entry updated, checking if all channels and entries are synced...')
      if (resolved) return
      // Check if all channels are synced
      if (await channelsSynced(services)) {
        // Check if all entries are synced for all channels (or just the specified one)
        if (await channelEntriesSynced(services, channelId)) {
          resolved = true
          cleanup()
          resolve(Date.now() - start)
        } else {
          logger.info('Entries are not synced yet, waiting for updates...')
          for (let i = 0; i < services.length; i++) {
            const service = services[i]
            for (const [id, repo] of service.publicChannelsRepos.entries()) {
              if (channelId && id !== channelId) continue
              const entries = await repo.store.getEntries()
              logger.warn(`Peer ${i} channel ${id} has ${entries.length} entries`)
            }
          }
        }
      } else {
        logger.info('Channels are not synced yet, waiting for updates...')
        for (let i = 0; i < services.length; i++) {
          const service = services[i]
          const channels = await service.getChannels()
          logger.warn(`Peer ${i} has ${channels.length} channels`)
        }
      }
    }

    const poll = setInterval(maybeResolve, timeoutMs / 3)
    timeout.unref?.()

    for (const service of services) {
      // Attach update listeners to all ChannelServices.channels
      service.channels?.events.on('update', maybeResolve)
      service.on(StorageEvents.CHANNEL_SUBSCRIBED, async (payload: ChannelSubscribedPayload) => {
        logger.info(`Channel subscribed: ${payload.channelId}`)
        // Attach update listeners to the specific channel store
        const repo = service.publicChannelsRepos.get(payload.channelId)
        if (repo) {
          repo.store.getStore().events.on('update', maybeResolve)
        } else {
          logger.warn(`No channel store found for channel ${payload.channelId}`)
        }
      })
    }

    // Listen for 'update' events on all ChannelStores in all services
    for (const service of services) {
      const channels = service.publicChannelsRepos
      for (const [id, repo] of channels.entries()) {
        if (channelId && id !== channelId) continue
        repo.store.getStore().events.on('update', maybeResolve)
      }
    }

    // Optionally run the callback after listeners are set up
    if (afterListenersSetup) {
      Promise.resolve(afterListenersSetup()).catch(err => logger.error('Error in afterListenersSetup:', err))
    }
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

  beforeAll(async () => {
    factory = await getBaseTypesFactory()
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
        const channelsService = module.get(ChannelsService)
        await ipfsService.createInstance()
        await ipfsService.start()
        await orbitDbService.create(libp2pNodeParams[i].peerId.peerId, ipfsService.ipfsInstance!)
        await channelsService.init()
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

  it('starts syncing channels for all peers', async () => {
    logger.info('starts syncing channels for all peers')
    await Promise.all(
      modules.map(async module => {
        const channelsService = module.get(ChannelsService)
        await channelsService.startSync()
      })
    )
  })

  it('creates a channel on the first peer', async () => {
    logger.info('creates a channel on the first peer')
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
  })

  it('waits for all peers to sync channels', async () => {
    logger.info('waits for all peers to sync channels')
    timeToLastSync = await waitForChannelsAndEntriesToSync(
      modules.map(module => module.get(ChannelsService)),
      undefined,
      10_000
    )
    expect(await channelsSynced(modules.map(module => module.get(ChannelsService)))).toBe(true)
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
        const channelStore = channelsService.publicChannelsRepos.get(publicChannels[0].id)
        if (!channelStore) {
          throw new Error(`Channel store for channel ${publicChannels[0].id} not found on peer ${i}`)
        }
        await channelStore.store.sendMessage(message)
      }
    }
    // Wait for all peers to receive the messages, sending them after listeners are set up
    timeToLastSync = await waitForChannelsAndEntriesToSync(
      modules.map(module => module.get(ChannelsService)),
      publicChannels[0].id,
      5_000,
      sendMessagesFromAllPeers
    )
    waitForExpect(
      async () => {
        expect(
          await channelEntriesSynced(
            modules.map(module => module.get(ChannelsService)),
            publicChannels[0].id
          )
        ).toBe(true)
      },
      1000,
      100
    )
    await waitForExpect(
      async () => {
        for (let i = 0; i < modules.length; i++) {
          const channelsService = modules[i].get(ChannelsService)
          const channelStore = channelsService.publicChannelsRepos.get(publicChannels[0].id)
          const entries = await channelStore?.store.getEntries()
          expect(entries?.length).toBe(messages.length)
        }
      },
      2000,
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
    const channelStore = channelsService.publicChannelsRepos.get(newChannel.id)
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
    await waitForChannelsAndEntriesToSync(
      modules.map(module => module.get(ChannelsService)),
      undefined,
      timeToLastSync ? timeToLastSync : 5000
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
      peer0Entries.push(decoded)
    }
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

  it('owner gracefully disconnects with all peers', async () => {
    logger.info('gracefully disconnects')
    const libp2pService = modules[0].get(Libp2pService)
    if (libp2pService.connectedPeers.size === 0) {
      logger.info('No connected peers to disconnect from.')
      return
    }
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

  // it('adds an initial entry to the mock store for all peers', async () => {
  //   logger.info('adds an initial entry to the mock store for all peers')
  //   await Promise.all(
  //     mockStores.map(async (mockStore, i) => {
  //       const entry = { peerId: mockStore.peerId, value: `Hello from peer ${mockStore.id}` }
  //       await mockStore.addEntry(entry)
  //       logger.info(`Added entry to peer ${mockStore.id}:`, entry)
  //     })
  //   )
  //   for (let i = 0; i < mockStores.length; i++) {
  //     const entries = await mockStores[i].getEntries()
  //     logger.info(`Entries for peer ${mockStores[i].id}:`, entries)
  //     expect(entries.length).toBe(1)
  //   }
  // })

  // it('all peers dial each other', async () => {
  //   logger.info('all peers dial each other')
  //   await Promise.all(
  //     modules.map(async (module, i) => {
  //       const libp2pService = module.get(Libp2pService)
  //       for (let j = 0; j < modules.length; j++) {
  //         if (i !== j) {
  //           await libp2pService.dialPeer(modules[j].get(Libp2pService).localAddress)
  //         }
  //       }
  //     })
  //   )
  //   // Wait for all peers to be connected
  //   await new Promise<void>(resolve => {
  //     const resolveIfMet = async () => {
  //       const isConnectedToAll = (peer: Libp2pService) => {
  //         return peer.connectedPeers.size === modules.length - 1
  //       }
  //       if (modules.map(module => isConnectedToAll(module.get(Libp2pService))).every(Boolean)) {
  //         resolve()
  //       }
  //     }
  //     for (const libp2pService of modules.slice(1).map(module => module.get(Libp2pService))) {
  //       libp2pService.once(Libp2pEvents.AUTH_CONNECTED, () => {
  //         resolveIfMet()
  //       })
  //     }
  //     resolveIfMet()
  //   })
  // })

  // it('verifies all peers are connected', async () => {
  //   logger.info('verifies all peers are connected')
  //   for (let i = 0; i < modules.length; i++) {
  //     const libp2pService = modules[i].get(Libp2pService)
  //     expect(libp2pService.connectedPeers.size).toBe(modules.length - 1)
  //   }
  // })

  // it('turns on syncing for all peers', async () => {
  //   logger.info('turns on syncing for all peers')
  //   await Promise.all(
  //     mockStores.map(async (mockStore, i) => {
  //       logger.info(`Syncing starting for peer ${i}`)
  //       await mockStore.startSync()
  //     })
  //   )
  // })

  // it('syncs entries between all peers', async () => {
  //   logger.info('syncs entries between all peers')

  //   await waitForEntriesToSync(mockStores, undefined, 5000, async () => {
  //     await mockStores[0].addEntry({
  //       peerId: mockStores[0].peerId,
  //       value: `Hello from peer ${mockStores[0].id} (added after sync started)`,
  //     })
  //   })

  //   expect(await entriesAreFullyUnioned(mockStores)).toBe(true)
  //   logger.info('All entries are synced between peers')
  // })

  // it('logs heads after syncing', async () => {
  //   logger.info('logs heads after syncing')
  //   for (let i = 0; i < mockStores.length; i++) {
  //     await logHeads(mockStores[i])
  //   }
  // })

  // it('adds a new entry to peer 0 and expects all peers to make that their head', async () => {
  //   logger.info('adds a new entry to peer 0 and expects all peers to make that their head')
  //   const newEntry = {
  //     peerId: libp2pNodeParams[0].peerId.peerId.toString(),
  //     value: 'This should be the new head',
  //   }
  //   await mockStores[0].addEntry(newEntry)
  //   logger.info(`Added entry to peer 0:`, newEntry)

  //   await waitForEntriesToSync(mockStores, (await mockStores[0].getEntries()).length)
  //   expect(await entriesAreFullyUnioned(mockStores, (await mockStores[0].getEntries()).length)).toBe(true)

  //   // expect all peers to have the same head
  //   const headsList = await Promise.all(mockStores.map(store => store.log.heads()))
  //   logger.info('New heads for all peers:', headsList)
  //   const referenceHeads = headsList[0]
  //   expect(referenceHeads.length).toEqual(1)
  //   for (let i = 1; i < headsList.length; i++) {
  //     expect(headsList[i].length).toBe(referenceHeads.length)
  //   }
  // })

  // it('stops syncing for all peers', async () => {
  //   logger.info('stops syncing for all peers')
  //   await Promise.all(
  //     mockStores.map(async (mockStore, i) => {
  //       logger.info(`Syncing stopping for peer ${i}`)
  //       await mockStore.stopSync()
  //     })
  //   )
  // })

  // it('adds a new entry to peer 0 and expects all peers to not sync it', async () => {
  //   logger.info('adds a new entry to peer 0 and expects all peers to not sync it')
  //   const newEntry = {
  //     peerId: libp2pNodeParams[0].peerId.peerId.toString(),
  //     value: 'This should NOT be synced',
  //   }
  //   await mockStores[0].addEntry(newEntry)
  //   logger.info(`Added entry to peer 0:`, newEntry)

  //   await new Promise<void>(resolve => {
  //     setTimeout(async () => {
  //       // Check if all peers have the same number of entries
  //       const entryCounts = await Promise.all(mockStores.map(store => store.getEntries()))
  //       logger.info('Entry counts for all peers:', entryCounts)
  //       expect(entryCounts.every(count => count.length === entryCounts[0].length)).toBe(false)
  //       resolve()
  //     }, 5000)
  //   })
  // })

  // it('injects the entry manually into peer 1', async () => {
  //   logger.info('injects the entry manually into peer 1')
  //   const head = (await mockStores[0].log.heads())[0]
  //   const entry = await Entry.decode(head.bytes)
  //   logger.info('Entry to inject:', entry)
  //   await mockStores[1].log.joinEntry(entry)
  //   logger.info(`Injected entry into peer 1:`, entry)
  //   const peer0Entries = await mockStores[0].getEntries()
  //   const peer1Entries = await mockStores[1].getEntries()
  //   logger.info('Entries for peer 0:', peer0Entries)
  //   logger.info('Entries for peer 1:', peer1Entries)
  //   expect(peer0Entries.length).toBe(peer1Entries.length)
  //   const peer0Heads = await mockStores[0].log.heads()
  //   const peer1Heads = await mockStores[1].log.heads()
  //   logger.info('Heads for peer 0:', peer0Heads)
  //   logger.info('Heads for peer 1:', peer1Heads)
  //   expect(peer0Heads.length).toBe(peer1Heads.length)
  //   expect(await entriesAreFullyUnioned([mockStores[0], mockStores[1]])).toBe(true)
  // })

  // it('does not break when peers 0 and 1 start syncing again', async () => {
  //   logger.info('does not break when peers 0 and 1 start syncing again')
  //   await Promise.all([mockStores[0].startSync(), mockStores[1].startSync()])
  //   logger.info('Syncing started for peers 0 and 1')
  //   await waitForEntriesToSync(mockStores, undefined, 2000)
  //   logger.info('Entries synced')
  //   expect(await entriesAreFullyUnioned([mockStores[0], mockStores[1]])).toBe(true)
  // })

  // it('simulates a conversation between peers 0 and 1', async () => {
  //   logger.info('simulates a conversation between peers 0 and 1')
  //   const conversationEntries = [
  //     { peerId: libp2pNodeParams[0].peerId.peerId.toString(), value: 'Multipart 1' },
  //     { peerId: libp2pNodeParams[0].peerId.peerId.toString(), value: 'Multipart 2' },
  //     { peerId: libp2pNodeParams[0].peerId.peerId.toString(), value: 'Multipart 3' },
  //     // { peerId: libp2pNodeParams[1].peerId.peerId.toString(), value: 'I am fine, thanks!' },
  //   ]
  //   for (const entry of conversationEntries) {
  //     if (entry.peerId === libp2pNodeParams[0].peerId.peerId.toString()) {
  //       await mockStores[0].addEntry(entry)
  //     }
  //     if (entry.peerId === libp2pNodeParams[1].peerId.peerId.toString()) {
  //       await mockStores[1].addEntry(entry)
  //     }
  //   }
  //   logger.info('Added conversation entries to peers 0 and 1')
  //   await waitForEntriesToSync([mockStores[0], mockStores[1]])
  //   expect(await entriesAreFullyUnioned([mockStores[0], mockStores[1]])).toBe(true)
  // })

  // it('injects just the head into peer 2 and peer 2 retrieves the rest with bitswap', async () => {
  //   logger.info('injects just the head into peer 2')
  //   const heads = await mockStores[0].log.heads()
  //   logger.info('Peer0 Heads:', heads)
  //   expect(heads.length).toBe(1)
  //   const head = heads[0]
  //   const peer2EntriesBeforeInjection = await mockStores[2].getEntries()
  //   logger.info('Entries for peer 2 before injection:', peer2EntriesBeforeInjection)
  //   // Inject the entry into peer 2
  //   const entry = await Entry.decode(head.bytes)
  //   logger.info('Entry to inject:', entry)
  //   await mockStores[2].log.joinEntry(entry)
  //   await waitForEntriesToSync([mockStores[0], mockStores[2]])
  //   logger.info(`Injected entry into peer 2:`, entry)
  //   const peer2Entries = await mockStores[2].getEntries()
  //   logger.info('Entries for peer 2:', peer2Entries)
  //   expect(await entriesAreFullyUnioned([mockStores[0], mockStores[2]])).toBe(true)
  // })

  // it('hangs up all peers for peer 3', async () => {
  //   logger.info('hangs up all peers for peer 3')
  //   const libp2pService = modules[3].get(Libp2pService)
  //   await libp2pService.hangUpPeers()
  //   // Wait for all peers to be disconnected
  //   await new Promise<void>(resolve => {
  //     const resolveIfMet = async () => {
  //       if (modules[3].get(Libp2pService).connectedPeers.size === 0) {
  //         resolve()
  //       }
  //     }
  //     modules[3].get(Libp2pService).once(Libp2pEvents.PEER_DISCONNECTED, () => {
  //       resolveIfMet()
  //     })
  //     resolveIfMet()
  //   })
  // })
  // it('inject just the head into peer 3 and expects it to stall', async () => {
  //   logger.info('inject just the head into peer 3 and expects it to stall')
  //   const head = (await mockStores[0].log.heads())[0]
  //   const peer0Entries = await mockStores[0].getEntries()
  //   await Promise.all(
  //     modules
  //       .filter((_, i) => i !== 3)
  //       .map(async module => {
  //         const libp2pService = module.get(Libp2pService)
  //         await libp2pService.close(false)
  //       })
  //   )
  //   const peer3EntriesBeforeInjection = await mockStores[3].getEntries()
  //   logger.info('Entries for peer 3 before injection:', peer3EntriesBeforeInjection)
  //   const entry = await Entry.decode(head.bytes)
  //   logger.info('Entry to inject:', entry)
  //   try {
  //     await mockStores[3].log.joinEntry(entry)
  //   } catch (err) {
  //     logger.error('Error injecting entry into peer 3:', err)
  //     // drops the entry directly into the entryStorage so that we don't have to request it from the network
  //     // await mockStores[3].log.entryStorage.write(entry)
  //   }
  //   logger.info(`Injected entry into peer 3:`, entry)
  //   // waitForEntriesToSync([mockStores[3]], peer0Entries.length, 5000)
  //   const peer3Entries = await mockStores[3].getEntries()
  //   logger.info('Entries for peer 3 after injection:', peer3Entries)
  //   expect(peer3Entries.length).toBe(peer3EntriesBeforeInjection.length)
  // }, 45000)
})
