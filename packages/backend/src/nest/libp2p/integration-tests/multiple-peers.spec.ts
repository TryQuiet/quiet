import { jest } from '@jest/globals'
import { TestingModule } from '@nestjs/testing'
import { Libp2pService } from '../libp2p.service'
import { SigChainService } from '../../auth/sigchain.service'
import { Libp2pEvents } from '../libp2p.types'
import { createLogger } from '../../common/logger'
import {
  spawnLibp2pInstancesInMemory,
  spawnTestModules,
  attachEventListeners,
  timelinesInclude,
} from '../../common/test-utils'
import { headsAreEqual, Hash } from '@localfirst/crdx'
import { InviteResult } from '3rd-party/auth/packages/auth/dist'

const logger = createLogger('libp2p:multiple-peers.spec')

const N_PEERS = 4
jest.setTimeout(120_000)
describe(`Libp2pAuth with ${N_PEERS} peers`, () => {
  const teamName: string = 'team'
  const eventTimeline: string[] = []
  const eventTimelines: Array<string[]> = []
  const modules: TestingModule[] = []

  beforeAll(async () => {
    modules.push(...(await spawnTestModules(N_PEERS)))
    const sigchainServiceA = await modules[0].resolve(SigChainService)

    // Create sigChain that all other peers will join
    await sigchainServiceA.createChain(teamName, 'user0', true)
    const inviteResult: InviteResult = sigchainServiceA.getActiveChain().invites.createLongLivedUserInvite()

    // Initialize other chains with invite seed
    for (let i = 1; i < modules.length; i++) {
      // Create invitation from A -> B
      const sigchainService = await modules[i].resolve(SigChainService)
      await sigchainService.createChainFromInvite(
        `user${i}`,
        inviteResult.seed,
        sigchainServiceA.activeChain.team!.id,
        true
      )
    }

    // Create libp2p instances (in-memory transport)
    await spawnLibp2pInstancesInMemory(modules)

    // Attach event listeners to all libp2p service instances
    for (let i = 0; i < modules.length; i++) {
      eventTimelines[i] = []
      attachEventListeners(await modules[i].get(Libp2pService), eventTimeline, `${i}`)
      attachEventListeners(await modules[i].get(Libp2pService), eventTimelines[i], `${i}`)
    }
  })

  // afterEach(async () => {
  //   // Clear event timelines
  //   eventTimeline.length = 0
  //   for (let i = 0; i < eventTimelines.length; i++) {
  //     eventTimelines[i].length = 0
  //   }
  // })

  afterAll(async () => {
    logger.info('Cleaning up modules')
    // Stop all instances and close modules
    for (const module of modules) {
      const libp2pService = await module.resolve(Libp2pService)
      await libp2pService.close()
    }
    logger.info('Closing modules')
    for (const module of modules) {
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

  it('emits connected after syncing', async () => {
    logger.info('emits connected after syncing')
    await new Promise<void>((resolve, reject) => {
      async function resolveIfMet() {
        logger.info('Event timelines:', eventTimelines)
        if (timelinesInclude(eventTimelines.slice(1), Libp2pEvents.AUTH_CONNECTED)) {
          clearInterval(interval)
          resolve()
        }
      }
      const interval = setInterval(resolveIfMet, 100)
      for (const libp2pService of modules.slice(1).map(module => module.get(Libp2pService))) {
        libp2pService.once(Libp2pEvents.AUTH_CONNECTED, () => {
          resolveIfMet()
        })
      }
      resolveIfMet()
    })
  }, 240_000)

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

  it('gracefully disconnects', async () => {
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
})
