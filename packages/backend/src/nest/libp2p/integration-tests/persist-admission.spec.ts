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

const logger = createLogger('libp2p:persistAdmission.spec')

/**
 * QSS-006 / private#203, threat-model C3 "Option A".
 *
 * The admitting device must have ADMIT_MEMBER on disk before the acceptance that
 * carries the team graph and keyring leaves the machine. Libp2pAuth supplies
 * @localfirst/auth with a persistAdmission hook that resolves only once the
 * write lands; on rejection the connection fails with ADMISSION_NOT_PERSISTED
 * and nothing is sent, so an invitee can never hold keys for an admission our
 * restart would forget and then be rejected as DEVICE_UNKNOWN.
 *
 * These drive a real invitee against a real member context over in-memory
 * libp2p, and read the bytes at the send callback rather than trusting events.
 */
describe('Libp2pAuth durable admission', () => {
  jest.setTimeout(60_000)

  let modules: TestingModule[] = []
  let sigChainA: SigChainService
  let sigChainB: SigChainService
  let libp2pA: Libp2pService
  let libp2pB: Libp2pService
  let localDbA: LocalDbService
  let teamId: string
  /** Every LFA message the admitter handed to its transport, in order. */
  let sentByAdmitter: Uint8Array[] = []

  const deferred = <T = void>() => {
    let resolve!: (value: T) => void
    const promise = new Promise<T>(res => {
      resolve = res
    })
    return { promise, resolve }
  }

  /** Message types the admitter has put on the wire so far. */
  const sentTypes = (): string[] =>
    sentByAdmitter
      .map(message => {
        try {
          return (unpack(message) as { type?: string })?.type ?? 'UNPARSEABLE'
        } catch {
          return 'UNPARSEABLE'
        }
      })
      .filter((type): type is string => type != null)

  beforeEach(async () => {
    sentByAdmitter = []
    modules = await spawnTestModules(2)
    sigChainA = await modules[0].resolve(SigChainService)
    sigChainB = await modules[1].resolve(SigChainService)
    libp2pA = await modules[0].resolve(Libp2pService)
    libp2pB = await modules[1].resolve(Libp2pService)
    localDbA = await modules[0].resolve(LocalDbService)

    // A owns the team and will act as the admitter; B holds only an invite seed.
    const chain = await sigChainA.createChain(true)
    teamId = chain.teamId!
    const invite = sigChainA.getActiveChain().invites.createLongLivedUserInvite()
    await sigChainB.createChainFromInvite({ seed: invite.seed }, teamId, true)

    await spawnLibp2pInstancesInMemory(modules)

    // Tap the admitter's transport so we can see whether the acceptance itself
    // was released, not just whether some event fired.
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

  it('holds the acceptance until the admission write resolves', async () => {
    const write = deferred()
    const setSigChainSpy = jest.spyOn(localDbA, 'setSigChainFromTeam').mockImplementation(async () => {
      await write.promise
    })

    let inviteeJoined = false
    libp2pB.once(Libp2pEvents.AUTH_JOINED, () => {
      inviteeJoined = true
    })

    await libp2pB.dialPeer(libp2pA.localAddress)

    // The admitter has appended the admission and is now blocked on our write.
    await waitForExpect(() => {
      expect(setSigChainSpy).toHaveBeenCalled()
    })
    await new Promise(resolve => setTimeout(resolve, 500))

    expect(sentTypes()).not.toContain('ACCEPT_INVITATION')
    expect(inviteeJoined).toBe(false)

    write.resolve()

    await waitForExpect(() => {
      expect(sentTypes()).toContain('ACCEPT_INVITATION')
      expect(inviteeJoined).toBe(true)
    })
    logger.info('acceptance released only after the admission write resolved')
  })

  it('fails closed with ADMISSION_NOT_PERSISTED and sends nothing when the write rejects', async () => {
    jest.spyOn(localDbA, 'setSigChainFromTeam').mockRejectedValue(new Error('disk is on fire'))

    const admitterErrors: string[] = []
    libp2pA.on(Libp2pEvents.AUTH_LOCAL_ERROR, ({ error }: { error: { type?: string } }) => {
      if (error?.type != null) admitterErrors.push(error.type)
    })
    let inviteeJoined = false
    libp2pB.once(Libp2pEvents.AUTH_JOINED, () => {
      inviteeJoined = true
    })

    await libp2pB.dialPeer(libp2pA.localAddress)

    await waitForExpect(() => {
      expect(admitterErrors).toContain('ADMISSION_NOT_PERSISTED')
    })

    expect(sentTypes()).not.toContain('ACCEPT_INVITATION')
    expect(inviteeJoined).toBe(false)
  })

  it('persists the admission to the real database before the invitee joins', async () => {
    // No stubbing: this is the happy path against the LevelDB in the module's tmp dir.
    const inviteeUserId = sigChainB.getActiveChain().user.userId

    await new Promise<void>(resolve => {
      libp2pB.once(Libp2pEvents.AUTH_JOINED, () => resolve())
      void libp2pB.dialPeer(libp2pA.localAddress)
    })

    expect(sentTypes()).toContain('ACCEPT_INVITATION')

    // Reload the admitter's chain from disk exactly as a restart would, and check
    // the invitee is actually in the graph we stored.
    const stored = await localDbA.getSigChain(teamId)
    expect(stored).toBeDefined()
    expect(stored!.serializedTeam).toBeDefined()
    expect(stored!.teamKeyRing).toBeDefined()

    const reloaded = SigChain.load(stored!.serializedTeam!, stored!.localUserContext, stored!.teamKeyRing!)
    expect(reloaded.team!.members().map(member => member.userId)).toContain(inviteeUserId)
  })
})
