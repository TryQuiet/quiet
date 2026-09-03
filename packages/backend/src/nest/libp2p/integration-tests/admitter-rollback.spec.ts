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

const logger = createLogger('libp2p:admitterRollback.spec')

/**
 * private#203 iteration-2. Retry coherence now comes from the admitting side
 * rather than from the invitee remembering old proofs.
 *
 * When an admission cannot be stored, the link is still sitting in the live
 * team. Left there it is committed by the next ordinary write, so the peer ends
 * up admitted by a record this device never made; and the admitter would serve
 * that same link on a retry, carrying a proof from the handshake that already
 * failed, which the invitee must reject. Rolling back to the stored team fixes
 * both: nothing stale is ever committed, and the retry gets a fresh admission
 * bound to the new handshake.
 */
describe('Libp2pAuth admitting-side rollback', () => {
  jest.setTimeout(120_000)

  let modules: TestingModule[] = []
  let sigChainA: SigChainService
  let sigChainB: SigChainService
  let libp2pA: Libp2pService
  let libp2pB: Libp2pService
  let localDbA: LocalDbService
  let teamId: string

  beforeEach(async () => {
    modules = await spawnTestModules(2)
    sigChainA = await modules[0].resolve(SigChainService)
    sigChainB = await modules[1].resolve(SigChainService)
    libp2pA = await modules[0].resolve(Libp2pService)
    libp2pB = await modules[1].resolve(Libp2pService)
    localDbA = await modules[0].resolve(LocalDbService)

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

  /**
   * Fails the admitter's next `count` writes that actually carry the invitee's
   * admission.
   *
   * Appending ADMIT_* also triggers an ordinary chain-update write, so failing
   * "the next write" would usually hit that one and leave the gate's own write
   * to succeed. The gate is what has to fail for a rollback to be under test.
   */
  const failAdmittingWrites = (count: number): { remaining: () => number; stopFailing: () => void } => {
    let remaining = count
    const original = localDbA.setSigChainFromTeam.bind(localDbA)
    jest.spyOn(localDbA, 'setSigChainFromTeam').mockImplementation(async (team: any, ctx: any, id: string) => {
      const inviteeUserId = sigChainB.getActiveChain().user.userId
      const carriesAdmission = team?.members?.().some((member: any) => member.userId === inviteeUserId) ?? false
      if (remaining > 0 && carriesAdmission) {
        remaining -= 1
        throw new Error('transient LevelDB failure on the admitter')
      }
      return original(team, ctx, id)
    })
    return {
      remaining: () => remaining,
      stopFailing: () => {
        remaining = 0
      },
    }
  }

  /** Admissions for the invitee's identity in the admitter's stored graph. */
  const storedAdmissionsForInvitee = async (): Promise<number> => {
    const inviteeUserId = sigChainB.getActiveChain().user.userId
    const stored = await localDbA.getSigChain(teamId)
    if (stored?.serializedTeam == null) return 0
    const reloaded = SigChain.load(stored.serializedTeam, stored.localUserContext, stored.teamKeyRing!)
    return reloaded.team!.members().filter(member => member.userId === inviteeUserId).length
  }

  it('discards the un-persisted admission and admits afresh on the retry', async () => {
    // Fail every write that carries the admission, so the gate itself fails and
    // the link genuinely never reaches disk.
    const writes = failAdmittingWrites(50)
    const joinedEvents: string[] = []
    libp2pB.on(Libp2pEvents.AUTH_JOINED, () => joinedEvents.push('authJoined'))

    await libp2pB.dialPeer(libp2pA.localAddress)

    await waitForExpect(() => {
      expect(sigChainA.rollbackCount(teamId)).toBeGreaterThanOrEqual(1)
    }, 30_000)
    expect(joinedEvents).toHaveLength(0)
    expect(await storedAdmissionsForInvitee()).toBe(0)

    // Storage recovers. The admitter has no admission to re-serve, so the second
    // handshake produces a new one bound to it, and the invitee can accept it.
    writes.stopFailing()
    const connections = libp2pB.libp2pInstance!.getConnections()
    await Promise.all(connections.map(async connection => connection.close()))
    await new Promise(resolve => setTimeout(resolve, 250))
    await libp2pB.dialPeer(libp2pA.localAddress)

    await waitForExpect(() => {
      expect(joinedEvents).toHaveLength(1)
    }, 60_000)

    // Exactly one admission on disk, from the second handshake.
    expect(await storedAdmissionsForInvitee()).toBe(1)
    expect(sigChainA.isChainBlocked(teamId)).toBe(false)
    logger.info('admitter rolled back and re-admitted with a fresh link')
  })

  it('never commits the un-persisted admission through a later ordinary write', async () => {
    // Every write carrying the admission fails, so the link never legitimately
    // reaches disk. Nothing queued behind it, and nothing issued afterwards, may
    // be the thing that commits it.
    const writes = failAdmittingWrites(50)

    await libp2pB.dialPeer(libp2pA.localAddress)

    await waitForExpect(() => {
      expect(sigChainA.rollbackCount(teamId)).toBeGreaterThanOrEqual(1)
    }, 30_000)

    // Let anything queued run, then issue a fresh ordinary write and look at
    // what actually reached the disk.
    await new Promise(resolve => setTimeout(resolve, 2_000))
    await sigChainA.persistChain(teamId).catch(() => undefined)

    expect(await storedAdmissionsForInvitee()).toBe(0)
    expect(writes.remaining()).toBeLessThan(50)
  })
})
