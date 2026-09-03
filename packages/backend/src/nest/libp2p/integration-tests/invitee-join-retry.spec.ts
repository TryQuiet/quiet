import { jest } from '@jest/globals'
import { TestingModule } from '@nestjs/testing'
import { unpack } from 'msgpackr'
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
 * private#203 L-2, and the iteration-2 correction to it.
 *
 * A failed invitee-side write used to leave terminal-looking state: joinStatus
 * was JOINED and the accepted team installed on the chain before the await, so
 * a transient LevelDB error suppressed the joined event but left every later
 * guard reading a join that had never been stored.
 *
 * The join now publishes nothing until the write lands. When the write fails,
 * the acceptance itself is already validated and in memory, so the fix is to
 * retry our own write rather than to go back to the network for a second
 * acceptance. A new handshake is both slower and, since the admitter would
 * re-serve the admission it already made, the thing that made a prior-proof
 * exception look necessary in the first place.
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
  /** Every LFA message the invitee put on the wire, in order. */
  let sentByInvitee: Uint8Array[] = []

  beforeEach(async () => {
    sentByInvitee = []
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

    const authB = libp2pB.libp2pInstance!.services['auth'] as any
    const originalSend = authB.sendMessage.bind(authB)
    jest.spyOn(authB, 'sendMessage').mockImplementation(async (...args: unknown[]) => {
      sentByInvitee.push(args[1] as Uint8Array)
      return originalSend(...args)
    })
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

  /** Message types the invitee has put on the wire so far. */
  const sentTypes = (): string[] =>
    sentByInvitee.map(message => {
      try {
        return (unpack(message) as { type?: string })?.type ?? 'UNPARSEABLE'
      } catch {
        return 'UNPARSEABLE'
      }
    })

  /** Fails the invitee's next `count` chain writes, then lets the rest through. */
  const failWrites = (count: number): { remaining: () => number } => {
    let remaining = count
    const original = localDbB.setSigChainFromTeam.bind(localDbB)
    jest.spyOn(localDbB, 'setSigChainFromTeam').mockImplementation(async (team: any, ctx: any, id: string) => {
      if (remaining > 0) {
        remaining -= 1
        throw new Error('transient LevelDB failure')
      }
      return original(team, ctx, id)
    })
    return { remaining: () => remaining }
  }

  const authServiceB = (): any => libp2pB.libp2pInstance!.services['auth']

  it('retries its own write and converges without a second handshake', async () => {
    const writes = failWrites(1)
    const joinedEvents: string[] = []
    libp2pB.on(Libp2pEvents.AUTH_JOINED, () => joinedEvents.push('authJoined'))

    await libp2pB.dialPeer(libp2pA.localAddress)

    await waitForExpect(() => {
      expect(writes.remaining()).toBe(0)
    }, 15_000)

    // Nothing observable says we joined while the write is still outstanding.
    expect(joinedEvents).toHaveLength(0)

    await waitForExpect(() => {
      expect(joinedEvents).toHaveLength(1)
    }, 20_000)

    expect(authServiceB().joinStatus).toBe(JoinStatus.JOINED)

    // The point of retrying locally: the acceptance we already hold is enough,
    // so the invitee never asks to be admitted a second time. Exactly one
    // identity claim, which is the first handshake's.
    const claims = sentTypes().filter(type => type === 'CLAIM_IDENTITY')
    expect(claims).toHaveLength(1)

    // And the join is durable, not just in memory.
    const stored = await localDbB.getSigChain(teamId)
    expect(stored?.serializedTeam).toBeDefined()
    const reloaded = SigChain.load(stored!.serializedTeam!, stored!.localUserContext, stored!.teamKeyRing!)
    expect(reloaded.team!.id).toBe(teamId)
    logger.info('invitee converged on a retried local write, with no second handshake')
  })

  /**
   * private#203 iteration-2 L-1: a rejected retry callback used to consume an
   * attempt and then wait for an unrelated event, so one unavailable moment on
   * the transport stranded a join that was otherwise retryable.
   *
   * This asserts the re-arm, not convergence. Once the local write budget is
   * spent the invitee goes back for a new acceptance, but the admitter's own
   * admission is already durable here, so it re-serves that link and its proof
   * belongs to the handshake that failed. Under strict current-proof equality
   * the invitee cannot accept it, which is the restart-only residual the audit
   * accepted rather than reopening a rollback window.
   */
  it('re-arms the redial when the redial itself throws', async () => {
    jest.spyOn(localDbB, 'setSigChainFromTeam').mockRejectedValue(new Error('disk is on fire'))

    // Call 1 is this test's own dial. Call 2 is the first retry-driven redial,
    // which fails. Nothing external re-arms it.
    let dialCalls = 0
    const originalDial = libp2pB.dialPeer
    jest.spyOn(libp2pB, 'dialPeer').mockImplementation(async (...args: Parameters<typeof originalDial>) => {
      dialCalls += 1
      if (dialCalls === 2) {
        throw new Error('transport unavailable')
      }
      return originalDial(...args)
    })

    await libp2pB.dialPeer(libp2pA.localAddress)

    await waitForExpect(() => {
      expect(dialCalls).toBeGreaterThanOrEqual(3)
    }, 40_000)
  })

  it('publishes nothing and does not latch JOINED while writes keep failing', async () => {
    // Never let a write succeed. The join must stay un-published and must not
    // latch a status that would stop anything from trying again.
    jest.spyOn(localDbB, 'setSigChainFromTeam').mockRejectedValue(new Error('disk is on fire'))
    const joinedEvents: string[] = []
    libp2pB.on(Libp2pEvents.AUTH_JOINED, () => joinedEvents.push('authJoined'))

    await libp2pB.dialPeer(libp2pA.localAddress)

    await new Promise(resolve => setTimeout(resolve, 6_000))

    expect(joinedEvents).toHaveLength(0)
    expect(authServiceB().joinStatus).not.toBe(JoinStatus.JOINED)
    // The local write budget is spent and the chain is an invitee again, so a
    // later attempt starts from a clean pre-join state rather than from a team
    // that was never stored.
    expect(sigChainB.getActiveChain().team).toBeNull()
  })
})
