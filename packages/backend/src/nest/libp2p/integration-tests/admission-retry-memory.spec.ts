import { jest } from '@jest/globals'
import { TestingModule } from '@nestjs/testing'
import waitForExpect from 'wait-for-expect'

import { SigChain } from '../../auth/sigchain'
import { SigChainService } from '../../auth/sigchain.service'
import { ATTEMPT_LIFETIME_MS } from '../../auth/services/invites/invitationAttemptMemory'
import { createLogger } from '../../common/logger'
import { spawnLibp2pInstancesInMemory, spawnTestModules } from '../../common/test-utils'
import { LocalDbService } from '../../local-db/local-db.service'
import { Libp2pService } from '../libp2p.service'
import { Libp2pEvents } from '../libp2p.types'

const logger = createLogger('libp2p:admissionRetryMemory.spec')

/**
 * private#203 M-1. An invitee accepts an admission only if the link carries the
 * proof from the current handshake, which is what stops a malicious acceptor
 * wrapping an older pre-removal graph in a fresh envelope. That rule also blocks
 * every legitimate retry, because the admitter still holds the admission it made
 * on the first attempt and that link carries the first attempt's proof.
 *
 * The narrow fix is for the invitee to remember the exact proof it presented and
 * to whom, and to accept that specific link on a later attempt against that same
 * peer. These drive it end to end: a real admitter whose own write fails, and a
 * real invitee that converges on the second attempt.
 */
describe('Libp2pAuth invitation retry memory', () => {
  jest.setTimeout(90_000)

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

  const inviteeChain = (): SigChain => sigChainB.getActiveChain()

  it('converges on a second attempt after the admitter fails to persist the first', async () => {
    // The admitter appends the admission, cannot store it, and so sends nothing.
    // Its in-memory team still holds that admission, so the retry is served the
    // same link, carrying the first attempt's proof.
    let admitterWritesToFail = 1
    const originalWrite = localDbA.setSigChain.bind(localDbA)
    jest.spyOn(localDbA, 'setSigChain').mockImplementation(async (chain: SigChain, id: string) => {
      if (admitterWritesToFail > 0) {
        admitterWritesToFail -= 1
        throw new Error('transient LevelDB failure on the admitter')
      }
      return originalWrite(chain, id)
    })

    const joinedEvents: string[] = []
    libp2pB.on(Libp2pEvents.AUTH_JOINED, () => joinedEvents.push('authJoined'))

    await libp2pB.dialPeer(libp2pA.localAddress)

    // First attempt: the gate fails closed, and the invitee keeps the proof it
    // presented so a later attempt can accept the link the admitter still holds.
    await waitForExpect(() => {
      expect(admitterWritesToFail).toBe(0)
      expect(inviteeChain().rememberedInvitationAttempts).toHaveLength(1)
    }, 20_000)
    expect(joinedEvents).toHaveLength(0)
    expect(inviteeChain().team).toBeNull()

    // Second attempt against the same admitter.
    const connections = libp2pB.libp2pInstance!.getConnections()
    await Promise.all(connections.map(async connection => connection.close()))
    await new Promise(resolve => setTimeout(resolve, 250))
    await libp2pB.dialPeer(libp2pA.localAddress)

    await waitForExpect(() => {
      expect(joinedEvents).toHaveLength(1)
    }, 30_000)
    expect(inviteeChain().team).not.toBeNull()

    // Dropped the moment the join is durable: a proof kept past its transaction
    // is exactly what the acceptance rule exists to prevent.
    expect(inviteeChain().rememberedInvitationAttempts).toHaveLength(0)
    logger.info('invitee converged against the admitter that still held the admission')
  })

  it('stops offering a remembered proof once it has expired', async () => {
    let admitterWritesToFail = 1
    const originalWrite = localDbA.setSigChain.bind(localDbA)
    jest.spyOn(localDbA, 'setSigChain').mockImplementation(async (chain: SigChain, id: string) => {
      if (admitterWritesToFail > 0) {
        admitterWritesToFail -= 1
        throw new Error('transient LevelDB failure on the admitter')
      }
      return originalWrite(chain, id)
    })

    await libp2pB.dialPeer(libp2pA.localAddress)
    await waitForExpect(() => {
      expect(inviteeChain().rememberedInvitationAttempts).toHaveLength(1)
    }, 20_000)

    // The proof is short-lived by policy, so a stale one is never presented.
    const realNow = Date.now()
    jest.spyOn(Date, 'now').mockReturnValue(realNow + ATTEMPT_LIFETIME_MS + 1)

    expect(inviteeChain().rememberedInvitationAttempts).toHaveLength(0)
    const context = inviteeChain().context as { priorInvitationProofs?: unknown }
    expect(context.priorInvitationProofs).toBeUndefined()
  })
})
