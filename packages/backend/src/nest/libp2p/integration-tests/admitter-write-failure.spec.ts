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

const logger = createLogger('libp2p:admitterWriteFailure.spec')

/**
 * private#203 / QSS-006. Pins what this device does when it cannot store an
 * admission, including the part that is deliberately not fixed.
 *
 * The gate fails closed: no acceptance is sent and the invitee gets
 * ADMISSION_NOT_PERSISTED, so it never holds keys this device has no record of.
 * That is the whole of the security property.
 *
 * What this device does not do is take the admission back out of memory. A later
 * ordinary write may commit it, and the invitee's retry is served that same link
 * carrying the failed handshake's proof, which its own validator rejects. So the
 * pair cannot converge until this device restarts. That is an accepted
 * availability residual, not a bug, and this spec exists so nobody later
 * mistakes it for one.
 */
describe('Libp2pAuth admission write failure', () => {
  jest.setTimeout(120_000)

  let modules: TestingModule[] = []
  let sigChainA: SigChainService
  let sigChainB: SigChainService
  let libp2pA: Libp2pService
  let libp2pB: Libp2pService
  let localDbA: LocalDbService
  let teamId: string
  /** Every LFA message the admitter put on the wire. */
  let sentByAdmitter: Uint8Array[] = []

  beforeEach(async () => {
    sentByAdmitter = []
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

    const authA = libp2pA.libp2pInstance!.services['auth'] as any
    const originalSend = authA.sendMessage.bind(authA)
    jest.spyOn(authA, 'sendMessage').mockImplementation(async (...args: unknown[]) => {
      sentByAdmitter.push(args[1] as Uint8Array)
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

  const sentTypes = (): string[] =>
    sentByAdmitter.map(message => {
      try {
        return (unpack(message) as { type?: string })?.type ?? 'UNPARSEABLE'
      } catch {
        return 'UNPARSEABLE'
      }
    })

  it('fails closed, and does not converge with that invitee again until it restarts', async () => {
    // Every write carrying the invitee's admission fails, so the gate itself
    // fails rather than some unrelated write.
    let failing = true
    const original = localDbA.setSigChainFromTeam.bind(localDbA)
    jest.spyOn(localDbA, 'setSigChainFromTeam').mockImplementation(async (team: any, ctx: any, id: string) => {
      const inviteeUserId = sigChainB.getActiveChain().user.userId
      const carriesAdmission = team?.members?.().some((member: any) => member.userId === inviteeUserId) ?? false
      if (failing && carriesAdmission) {
        throw new Error('transient LevelDB failure on the admitter')
      }
      return original(team, ctx, id)
    })

    const inviteeJoined: string[] = []
    libp2pB.on(Libp2pEvents.AUTH_JOINED, () => inviteeJoined.push('authJoined'))
    const admitterErrors: string[] = []
    libp2pA.on(Libp2pEvents.AUTH_LOCAL_ERROR, ({ error }: { error: { type?: string } }) => {
      if (error?.type != null) admitterErrors.push(error.type)
    })

    await libp2pB.dialPeer(libp2pA.localAddress)

    // The security property: the gate fails closed. No acceptance leaves the
    // admitter, and the invitee is told why.
    await waitForExpect(() => {
      expect(sigChainA.failedAdmissionWriteCount(teamId)).toBeGreaterThanOrEqual(1)
    }, 30_000)
    await waitForExpect(() => {
      expect(admitterErrors).toContain('ADMISSION_NOT_PERSISTED')
    }, 30_000)
    expect(sentTypes()).not.toContain('ACCEPT_INVITATION')
    expect(inviteeJoined).toHaveLength(0)
    expect(sigChainB.getActiveChain().team).toBeNull()

    // Storage recovers, and an ordinary write on this device succeeds. The
    // admission is still in memory and may now reach disk with it; nothing here
    // undoes it.
    failing = false
    await sigChainA.persistChain(teamId)

    // The residual: the invitee retries against the same device and is still not
    // let in, because it is served the link carrying the first handshake's proof.
    const connections = libp2pB.libp2pInstance!.getConnections()
    await Promise.all(connections.map(async connection => connection.close()))
    await new Promise(resolve => setTimeout(resolve, 250))
    await libp2pB.dialPeer(libp2pA.localAddress)

    await new Promise(resolve => setTimeout(resolve, 8_000))

    expect(inviteeJoined).toHaveLength(0)
    expect(sigChainB.getActiveChain().team).toBeNull()
    logger.info('gate failed closed; the pair does not converge until the admitter restarts')
  })

  it('admits normally once the admitting device has reloaded its durable graph', async () => {
    // What a restart gives back, without restarting a process in a test: the
    // durable graph has no admission, so a fresh handshake produces one.
    const stored = await localDbA.getSigChain(teamId)
    expect(stored?.serializedTeam).toBeDefined()
    const reloaded = SigChain.load(stored!.serializedTeam!, stored!.localUserContext, stored!.teamKeyRing!)
    const inviteeUserId = sigChainB.getActiveChain().user.userId
    expect(reloaded.team!.members().map(member => member.userId)).not.toContain(inviteeUserId)

    const inviteeJoined: string[] = []
    libp2pB.on(Libp2pEvents.AUTH_JOINED, () => inviteeJoined.push('authJoined'))

    await libp2pB.dialPeer(libp2pA.localAddress)

    await waitForExpect(() => {
      expect(inviteeJoined).toHaveLength(1)
    }, 30_000)
    expect(sentTypes()).toContain('ACCEPT_INVITATION')
  })
})
