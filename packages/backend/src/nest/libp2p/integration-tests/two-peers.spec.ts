import { TestingModule } from '@nestjs/testing'
import { Libp2pService } from '../libp2p.service'
import { SigChainService } from '../../auth/sigchain.service'
import { Libp2pEvents } from '../libp2p.types'
import { createLogger } from '../../common/logger'
import { headsAreEqual } from '@localfirst/crdx'
import {
  spawnLibp2pInstancesInMemory,
  spawnTestModules,
  attachEventListeners,
  timelinesInclude,
} from '../../common/test-utils'

const logger = createLogger('libp2p:libp2p.auth.spec')

describe('Libp2pAuth', () => {
  const teamName: string = 'team'
  const userA: string = 'instance0'
  const userB: string = 'instance1'
  const eventTimeline: string[] = []
  const eventTimelineA: string[] = []
  const eventTimelineB: string[] = []
  const modules: TestingModule[] = []
  let sigchainServiceA: SigChainService
  let sigchainServiceB: SigChainService
  let libp2pServiceA: Libp2pService
  let libp2pServiceB: Libp2pService
  const captureTimelines = () => ({
    all: [...eventTimeline],
    a: [...eventTimelineA],
    b: [...eventTimelineB],
  })

  beforeAll(async () => {
    modules.push(...(await spawnTestModules(2)))
    sigchainServiceA = await modules[0].resolve(SigChainService)
    sigchainServiceB = await modules[1].resolve(SigChainService)
    libp2pServiceA = await modules[0].resolve(Libp2pService)
    libp2pServiceB = await modules[1].resolve(Libp2pService)

    attachEventListeners(libp2pServiceA, eventTimeline, 'A')
    attachEventListeners(libp2pServiceB, eventTimeline, 'B')
    attachEventListeners(libp2pServiceA, eventTimelineA, 'A')
    attachEventListeners(libp2pServiceB, eventTimelineB, 'B')

    // Create chain for instance A
    const chain = await sigchainServiceA.createChain(true)
    expect(chain.teamId).toBeDefined()
    expect(sigchainServiceA.activeChainTeamId).toBe(chain.teamId)

    // Create invitation from A -> B
    const inviteResult = sigchainServiceA.getActiveChain().invites.createLongLivedUserInvite()
    await sigchainServiceB.createChainFromInvite({ seed: inviteResult.seed }, sigchainServiceA.team.id, true)
  })

  afterAll(async () => {
    for (const module of modules) {
      const libp2pService = await module.resolve(Libp2pService)
      await libp2pService.close()
      await module.close()
    }
  })

  it('create two instances of libp2p', async () => {
    logger.info('Creating libp2p instances')
    await spawnLibp2pInstancesInMemory(modules)
    logger.info('Created libp2p instances')
    expect(libp2pServiceA.libp2pInstance).toBeDefined()
    expect(libp2pServiceB.libp2pInstance).toBeDefined()
  })

  it('joins with an invitation', async () => {
    logger.info('Initializes chains when peers connect')
    // Wait for chain init event on B
    const joined = await new Promise<ReturnType<typeof captureTimelines>>((resolve, reject) => {
      libp2pServiceB.once(Libp2pEvents.AUTH_JOINED, () => {
        logger.info('libp2pServiceB initialized chain')
        resolve(captureTimelines())
      })
      void libp2pServiceB.dialPeer(libp2pServiceA.localAddress).catch(reject)
    })
    // Capture the boundary in the callback, then assert in the test. Peers
    // advance independently; their complete local timelines remain ordered.
    expect(joined.all.filter(event => event === Libp2pEvents.PEER_CONNECTED)).toHaveLength(2)
    expect(joined.all.filter(event => event === Libp2pEvents.AUTH_JOINED)).toHaveLength(1)
    expect(joined.all.filter(event => event === Libp2pEvents.AUTH_CONNECTED)).toHaveLength(0)
    expect(joined.a).toMatchSnapshot('instanceA event timeline after join')
    expect(joined.b).toMatchSnapshot('instanceB event timeline after join')

    expect(sigchainServiceA.getActiveChain().team).toBeDefined()
    expect(sigchainServiceB.getActiveChain().team).toBeDefined()
    expect(sigchainServiceA.getActiveChain() !== sigchainServiceB.getActiveChain()).toBeTruthy()
    // at this point B should have added themselves to the chain, but not yet synced that with A
    expect(
      headsAreEqual(
        sigchainServiceA.getActiveChain().team?.graph.head,
        sigchainServiceB.getActiveChain().team?.graph.head
      )
    ).toBeFalsy()
  })
  it('emits connected after syncing', async () => {
    logger.info('Emits connected after syncing')
    const connected = await new Promise<ReturnType<typeof captureTimelines>>((resolve, reject) => {
      const timeout = setTimeout(() => {
        libp2pServiceA.off(Libp2pEvents.AUTH_CONNECTED, resolveIfMet)
        libp2pServiceB.off(Libp2pEvents.AUTH_CONNECTED, resolveIfMet)
        reject(new Error('AUTH_CONNECTED events did not occur within expected time.'))
      }, 70_000)
      const resolveIfMet = () => {
        if (timelinesInclude([eventTimelineA, eventTimelineB], Libp2pEvents.AUTH_CONNECTED)) {
          logger.info('timelines include expected events!')
          clearTimeout(timeout)
          libp2pServiceA.off(Libp2pEvents.AUTH_CONNECTED, resolveIfMet)
          libp2pServiceB.off(Libp2pEvents.AUTH_CONNECTED, resolveIfMet)
          resolve(captureTimelines())
        }
      }
      libp2pServiceA.on(Libp2pEvents.AUTH_CONNECTED, resolveIfMet)
      libp2pServiceB.on(Libp2pEvents.AUTH_CONNECTED, resolveIfMet)
      resolveIfMet()
    })
    expect(connected.all.filter(event => event === Libp2pEvents.PEER_CONNECTED)).toHaveLength(2)
    expect(connected.all.filter(event => event === Libp2pEvents.AUTH_JOINED)).toHaveLength(1)
    expect(connected.all.filter(event => event === Libp2pEvents.AUTH_CONNECTED)).toHaveLength(2)
    expect(connected.a).toMatchSnapshot('instanceA event timeline after connected')
    expect(connected.b).toMatchSnapshot('instanceB event timeline after connected')
    // at this point the sync should be complete and the heads should be equal
    expect(
      headsAreEqual(
        sigchainServiceA.getActiveChain().team?.graph.head,
        sigchainServiceB.getActiveChain().team?.graph.head
      )
    ).toBeTruthy()
  })
  it('gracefully disconnects', async () => {
    logger.info('Gracefully disconnects')
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('PEER_DISCONNECTED events did not occur within expected time.'))
      }, 70_000)
      const resolveIfMet = async () => {
        if (
          eventTimelineA.includes(Libp2pEvents.PEER_DISCONNECTED) &&
          eventTimelineB.includes(Libp2pEvents.PEER_DISCONNECTED)
        ) {
          // Both sessions and transports close; cross-peer scheduling does not
          // promise a single combined order. Retain each complete peer timeline.
          expect(eventTimeline.filter(event => event === Libp2pEvents.AUTH_DISCONNECTED)).toHaveLength(2)
          expect(eventTimeline.filter(event => event === Libp2pEvents.PEER_DISCONNECTED)).toHaveLength(2)
          expect(eventTimelineA).toMatchSnapshot('disconnectEventsA')
          expect(eventTimelineB).toMatchSnapshot('disconnectEventsB')
          clearTimeout(timeout)
          resolve()
        }
      }
      libp2pServiceA.once(Libp2pEvents.PEER_DISCONNECTED, () => {
        logger.info('test listener heard libp2pServiceA disconnected')
        resolveIfMet()
      })
      libp2pServiceB.once(Libp2pEvents.PEER_DISCONNECTED, () => {
        logger.info('test listener heard libp2pServiceB disconnected')
        resolveIfMet()
      })
      libp2pServiceB.hangUpPeers()
    })
  })
})
