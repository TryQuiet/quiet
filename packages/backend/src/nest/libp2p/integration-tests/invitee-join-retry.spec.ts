import { jest } from '@jest/globals'
import { TestingModule } from '@nestjs/testing'
import waitForExpect from 'wait-for-expect'

import { SigChain } from '../../auth/sigchain'
import { SigChainService } from '../../auth/sigchain.service'
import { createLogger } from '../../common/logger'
import { spawnLibp2pInstancesInMemory, spawnTestModules } from '../../common/test-utils'
import { LocalDbService } from '../../local-db/local-db.service'
import { Libp2pService } from '../libp2p.service'
import { Libp2pEvents } from '../libp2p.types'
import { JoinStatus } from '../libp2p.auth'

const logger = createLogger('libp2p:inviteeJoinRetry.spec')

/**
 * private#203 L-2. A failed invitee-side write used to leave terminal-looking
 * state: joinStatus was set to JOINED and the accepted team was installed on the
 * chain before the await, so a transient LevelDB error suppressed the joined
 * event but left every later guard reading a join that had never been stored.
 * Buffered peers stayed blocked and nothing re-entered the path.
 *
 * The join must now publish nothing until the write lands, roll back what it
 * staged if the write fails, and re-attempt with backoff.
 */
describe('Libp2pAuth invitee join persistence failure', () => {
  jest.setTimeout(90_000)

  let modules: TestingModule[] = []
  let sigChainA: SigChainService
  let sigChainB: SigChainService
  let libp2pA: Libp2pService
  let libp2pB: Libp2pService
  let localDbB: LocalDbService
  let teamId: string

  beforeEach(async () => {
    modules = await spawnTestModules(2)
    sigChainA = await modules[0].resolve(SigChainService)
    sigChainB = await modules[1].resolve(SigChainService)
    libp2pA = await modules[0].resolve(Libp2pService)
    libp2pB = await modules[1].resolve(Libp2pService)
    localDbB = await modules[1].resolve(LocalDbService)

    const chain = await sigChainA.createChain(true)
    teamId = chain.teamId!
    const invite = sigChainA.getActiveChain().invites.createLongLivedUserInvite()
    await sigChainB.createChainFromInvite({ seed: invite.seed }, teamId, true)

    await spawnLibp2pInstancesInMemory(modules)
  })

  afterEach(async () => {
    jest.restoreAllMocks()
    for (const module of modules) {
      const libp2pService = await module.resolve(Libp2pService)
      await libp2pService.close()
      await module.close()
    }
    modules = []
  })

  /** Fails the invitee's next `count` chain writes, then lets the rest through. */
  const failWrites = (count: number): { remaining: () => number } => {
    let remaining = count
    const original = localDbB.setSigChain.bind(localDbB)
    jest.spyOn(localDbB, 'setSigChain').mockImplementation(async (chain: SigChain, id: string) => {
      if (remaining > 0) {
        remaining -= 1
        throw new Error('transient LevelDB failure')
      }
      return original(chain, id)
    })
    return { remaining: () => remaining }
  }

  const authServiceB = (): any => libp2pB.libp2pInstance!.services['auth']

  it('publishes nothing and rolls the join back when the write fails, then converges on retry', async () => {
    const writes = failWrites(1)
    const joinedEvents: string[] = []
    libp2pB.on(Libp2pEvents.AUTH_JOINED, () => joinedEvents.push('authJoined'))

    await libp2pB.dialPeer(libp2pA.localAddress)

    // First attempt: the write is consumed and rejected.
    await waitForExpect(() => {
      expect(writes.remaining()).toBe(0)
    }, 15_000)

    // Nothing observable says we joined, and the staged team is gone again.
    expect(joinedEvents).toHaveLength(0)
    expect(sigChainB.getActiveChain().team).toBeNull()
    expect(authServiceB().joinStatus).not.toBe(JoinStatus.JOINED)

    // The retry re-admits us and this time the write lands.
    await waitForExpect(() => {
      expect(joinedEvents).toHaveLength(1)
    }, 20_000)

    expect(sigChainB.getActiveChain().team).not.toBeNull()
    expect(authServiceB().joinStatus).toBe(JoinStatus.JOINED)

    // The join is durable, not just in memory: it reloads from disk.
    const stored = await localDbB.getSigChain(teamId)
    expect(stored?.serializedTeam).toBeDefined()
    const reloaded = SigChain.load(stored!.serializedTeam!, stored!.localUserContext, stored!.teamKeyRing!)
    expect(reloaded.team!.id).toBe(teamId)
    logger.info('invitee join converged after a failed write')
  })

  it('leaves the join retryable rather than terminal while writes keep failing', async () => {
    // Never let a write succeed: the join must stay un-published and must not
    // latch a JOINED status that would stop anything from trying again.
    jest.spyOn(localDbB, 'setSigChain').mockRejectedValue(new Error('disk is on fire'))
    const joinedEvents: string[] = []
    libp2pB.on(Libp2pEvents.AUTH_JOINED, () => joinedEvents.push('authJoined'))

    await libp2pB.dialPeer(libp2pA.localAddress)

    await new Promise(resolve => setTimeout(resolve, 4_000))

    expect(joinedEvents).toHaveLength(0)
    expect(sigChainB.getActiveChain().team).toBeNull()
    expect(authServiceB().joinStatus).not.toBe(JoinStatus.JOINED)
  })
})
