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
import { ChannelSubscribedPayload, PublicChannel } from '@quiet/types'
import { getBaseTypesFactory } from '@quiet/state-manager'
import { FactoryGirl } from 'factory-girl'
import waitForExpect from 'wait-for-expect'
import { StorageEvents } from '../../storage/storage.types'
import { LocalDbService } from '../../local-db/local-db.service'

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
 * Checks if all ChannelsService instances have the same set of channels, and that each channel is identical across services.
 *
 * @param services - Array of ChannelsService instances to check.
 * @returns True if all services have the same channels, false otherwise.
 */
async function channelsSynced(services: ChannelsService[]): Promise<boolean> {
  // Collect all unique channel IDs across all services
  const allChannelIds = new Set<string>()
  const serviceChannelsArr: PublicChannel[][] = []
  for (const service of services) {
    const serviceChannels = await service.getChannels()
    serviceChannelsArr.push(serviceChannels)
    for (const channel of serviceChannels) {
      allChannelIds.add(channel.id)
    }
  }
  // For each channel ID, check that every service has it and all are deeply equal
  for (const id of allChannelIds) {
    const channelsForId: PublicChannel[] = []
    for (const serviceChannels of serviceChannelsArr) {
      const found = serviceChannels.find(c => c.id === id)
      if (!found) {
        logger.error(`Channel ${id} is missing in some services`)
        return false
      }
      channelsForId.push(found)
    }
    const firstChannel = channelsForId[0]
    for (const channel of channelsForId) {
      if (!deepArrayEqual([channel], [firstChannel])) {
        logger.error(`Channel ${id} differs between services`)
        return false
      }
    }
  }
  // Also check that all services have the same number of channels
  const expectedCount = serviceChannelsArr[0].length
  for (const serviceChannels of serviceChannelsArr) {
    if (serviceChannels.length !== expectedCount) {
      logger.error(
        `A service has a different number of channels: expected ${expectedCount}, got ${serviceChannels.length}`
      )
      return false
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
  // Build a set of all unique channel IDs across all services (optionally filtered by channelId)
  const allChannelIds = new Set<string>()
  const serviceChannelsArr: PublicChannel[][] = []
  const allEntriesInChannel: Map<string, Set<string>> = new Map()
  for (const service of services) {
    const serviceChannels = await service.getChannels()
    serviceChannelsArr.push(serviceChannels)
    for (const channel of serviceChannels) {
      if (channelId && channel.id !== channelId) continue
      allChannelIds.add(channel.id)
      const repo = service.publicChannelsRepos.get(channel.id)
      if (!repo) {
        logger.error(`Channel ${channel.id} is missing in service ${services.indexOf(service)}`)
        return false
      }
      const entries = await repo.store.getEntries()
      if (!allEntriesInChannel.has(channel.id)) {
        allEntriesInChannel.set(channel.id, new Set<string>())
      }
      const entrySet = allEntriesInChannel.get(channel?.id)
      if (entrySet) {
        for (const entry of entries) {
          entrySet.add(entry.id)
        }
      }
    }
  }
  // For each channel ID, check that every service has the complete set of entries
  for (const id of allChannelIds) {
    for (let i = 0; i < services.length; i++) {
      const service = services[i]
      const repo = service.publicChannelsRepos.get(id)
      if (!repo) {
        logger.error(`Channel ${id} is missing in service ${i}`)
        return false
      }
      const entries = await repo.store.getEntries()
      const entrySet = allEntriesInChannel.get(id)
      if (!entrySet) {
        logger.error(`No entries found for channel ${id} in any service`)
        return false
      }
      // Check if all entries in this service match the expected set
      const serviceEntryIds = new Set(entries.map(e => e.id))
      if (serviceEntryIds.size !== entrySet.size || ![...serviceEntryIds].every(id => entrySet.has(id))) {
        const missingInService = [...entrySet].filter(id => !serviceEntryIds.has(id))
        logger.error(
          `Entries for channel ${id} differ in service ${i}.` +
            (missingInService.length ? ` Missing in service: [${missingInService.join(', ')}].` : '')
        )
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
 * @param pollRate - Rate in milliseconds to poll for updates.
 * @returns Promise that resolves with sync time in ms, or undefined if timeout is reached.
 */
async function waitForChannelsAndEntriesToSync(
  services: ChannelsService[],
  channelId?: string,
  timeoutMs = 5000,
  afterListenersSetup?: () => Promise<void> | void,
  pollRate = 100
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

    const poll = setInterval(maybeResolve, timeoutMs / 10)
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
        const localDbService = module.get(LocalDbService)
        await localDbService.open()
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
        expect(await channelsSynced(modules.map(module => module.get(ChannelsService)))).toBe(true)
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
        const channelStore = channelsService.publicChannelsRepos.get(publicChannels[0].id)
        if (!channelStore) {
          throw new Error(`Channel store for channel ${publicChannels[0].id} not found on peer ${i}`)
        }
        await channelStore.store.sendMessage(message)
      }
    }

    timeToLastSync = await waitForChannelsAndEntriesToSync(
      modules.map(module => module.get(ChannelsService)),
      publicChannels[0].id,
      5_000,
      sendMessagesFromAllPeers
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
          const channelStore = channelsService.publicChannelsRepos.get(publicChannels[0].id)
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
})
