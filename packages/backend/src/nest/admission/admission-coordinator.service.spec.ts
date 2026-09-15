import { jest } from '@jest/globals'
import { AdmissionCoordinator } from './admission-coordinator.service'
import { AdmissionClock } from './admission-clock'
import { ADMISSION_DRAIN_TIMEOUT_MS, ADMISSION_TOR_BOOTSTRAP_TIMEOUT_MS } from './admission.const'
import { CommunityLifecycle } from './community-lifecycle'
import type { TorBootstrapProvider } from '../libp2p/libp2p.types'
import {
  AdmissionAttemptOptions,
  AdmissionBusyError,
  AdmissionError,
  AdmissionKind,
  AdmissionRecoveryRequiredError,
  AdmissionRequest,
  AdmissionTransport,
} from './admission.types'

function deferred<T = void>() {
  let resolve!: (value: T) => void
  let reject!: (error: Error) => void
  const promise = new Promise<T>((yes, no) => {
    resolve = yes
    reject = no
  })
  return { promise, resolve, reject }
}
const flush = async () => {
  for (let i = 0; i < 30; i++) await Promise.resolve()
}

describe('AdmissionCoordinator lifecycle regressions', () => {
  let coordinator: AdmissionCoordinator
  let request: AdmissionRequest
  let lease: CommunityLifecycle
  let options: AdmissionAttemptOptions[]
  let prepare: ReturnType<typeof jest.fn<() => Promise<void>>>
  let start: ReturnType<typeof jest.fn<() => Promise<void>>>
  let cleanup: ReturnType<typeof jest.fn<() => Promise<void>>>
  let commit: ReturnType<typeof jest.fn<() => Promise<void>>>
  let claim: ReturnType<typeof jest.fn<() => Promise<string>>>
  let stored: AdmissionTransport | undefined
  let synchronousStart: boolean
  let discard: ReturnType<typeof jest.fn>
  let load: ReturnType<typeof jest.fn<() => Promise<{ admissionTransport: AdmissionTransport | undefined }>>>
  let stage: ReturnType<typeof jest.fn<() => { device: { deviceId: string } }>>

  beforeEach(() => {
    jest.useFakeTimers()
    request = {
      communityId: 'community',
      teamId: 'team',
      expectedUserId: 'user',
      expectedDeviceId: 'device',
      kind: AdmissionKind.DEVICE,
      preferredTransport: AdmissionTransport.QSS,
      timeoutMs: 120_000,
    }
    lease = new CommunityLifecycle('community', {} as any, 'wss://qss')
    options = []
    stored = undefined
    synchronousStart = false
    prepare = jest.fn(async () => undefined)
    start = jest.fn(async () => undefined)
    cleanup = jest.fn(async () => undefined)
    commit = jest.fn(async () => undefined)
    claim = jest.fn(async () => 'claimed')
    discard = jest.fn()
    load = jest.fn(async () => ({ admissionTransport: stored }))
    stage = jest.fn(() => ({ device: { deviceId: 'device' } }))
    const adapter = {
      create: (option: AdmissionAttemptOptions) => {
        options.push(option)
        option.scope.own(cleanup)
        return {
          context: option.context,
          prepare: () => option.scope.run(prepare),
          start: () => (synchronousStart ? start() : option.scope.run(start)),
          stop: (error: Error) => {
            option.context.gate.revoke()
            return option.scope.drain(error)
          },
        }
      },
    }
    const clock = new AdmissionClock()
    jest.spyOn(clock, 'now').mockImplementation(() => Date.now())
    coordinator = new AdmissionCoordinator(
      adapter as any,
      adapter as any,
      {
        beginAdmission: () => ({ stage, commit, discard }),
      } as any,
      { getCommunity: load, claimAdmissionTransport: claim } as any,
      clock
    )
  })
  afterEach(() => jest.useRealTimers())
  const payload = () => ({ team: { id: 'team' } as any, user: { userId: 'user' } as any })

  it.each(['resolve', 'reject'] as const)('fences cancelled loading until the database read %ss', async outcome => {
    const pending = deferred<{ admissionTransport: AdmissionTransport | undefined }>()
    load.mockReturnValueOnce(pending.promise)
    const handle = coordinator.start(request, lease)
    await flush()
    expect(load).toHaveBeenCalledTimes(1)
    const reason = new Error('community switched during loading')
    const draining = lease.drain(reason)
    await expect(handle.result).rejects.toBe(reason)
    const nextLease = new CommunityLifecycle('community', {} as any)
    expect(() => coordinator.start(request, nextLease)).toThrow(AdmissionBusyError)
    expect(stage).not.toHaveBeenCalled()
    if (outcome === 'resolve') pending.resolve({ admissionTransport: undefined })
    else pending.reject(new Error('late database read failure'))
    await draining
    expect(options).toHaveLength(0)
    expect(discard).not.toHaveBeenCalled()
    const next = coordinator.start(request, nextLease)
    await flush()
    await options[0].context.joined(payload())
    await expect(next.result).resolves.toMatchObject({ teamId: 'team' })
    await nextLease.drain(new Error('finished'))
  })

  it('bounds stalled community loading and retains ownership when the database read never settles', async () => {
    const pending = deferred<{ admissionTransport: AdmissionTransport | undefined }>()
    load.mockReturnValueOnce(pending.promise)
    const handle = coordinator.start(request, lease)
    await flush()

    jest.advanceTimersByTime(request.timeoutMs)
    await expect(handle.result).rejects.toMatchObject({ kind: 'timeout' })
    expect(options).toHaveLength(0)

    jest.advanceTimersByTime(ADMISSION_DRAIN_TIMEOUT_MS)
    await expect(handle.drained).rejects.toMatchObject({ kind: 'recovery' })
    expect(() => coordinator.start(request, new CommunityLifecycle('community', {} as any))).toThrow(AdmissionBusyError)

    pending.resolve({ admissionTransport: undefined })
    await flush()
    expect(coordinator['activeSession']!.state.status).toBe('recovery-required')
    expect(stage).not.toHaveBeenCalled()
  })

  it('retains ownership when QSS cleanup fails during fallback', async () => {
    cleanup.mockRejectedValueOnce(new Error('QSS socket did not close'))
    const handle = coordinator.start(request, lease)
    await flush()
    jest.advanceTimersByTime(60_000)
    await expect(handle.result).rejects.toMatchObject({ kind: 'recovery' })
    await expect(handle.drained).rejects.toMatchObject({ kind: 'recovery' })
    expect(options).toHaveLength(1)
    expect(commit).not.toHaveBeenCalled()
    expect(discard).not.toHaveBeenCalled()
    expect(() => options[0].context.joined(payload())).toThrow('closed')
    expect(() => coordinator.start(request, new CommunityLifecycle('community', {} as any))).toThrow(AdmissionBusyError)
    await expect(lease.drain(new Error('shutdown'))).rejects.toMatchObject({ kind: 'recovery' })
    expect(cleanup).toHaveBeenCalledTimes(1)
  })

  it('starts the P2P deadline only after Tor bootstraps', async () => {
    let onBootstrapped!: () => void
    const torBootstrap = { bootstrapped: false } as TorBootstrapProvider
    const once = jest.fn((_event: 'bootstrapped', listener: () => void) => {
      onBootstrapped = listener
      return torBootstrap
    })
    torBootstrap.once = once
    const p2pLease = new CommunityLifecycle('community', { torBootstrap } as any)
    const handle = coordinator.start({ ...request, preferredTransport: AdmissionTransport.P2P }, p2pLease)
    await flush()

    expect(torBootstrap.once).toHaveBeenCalledWith('bootstrapped', expect.any(Function))
    expect(coordinator['activeSession']!.deadline).toBeUndefined()
    jest.advanceTimersByTime(ADMISSION_TOR_BOOTSTRAP_TIMEOUT_MS - 1)
    expect(coordinator['activeSession']!.state.status).toBe('admitting')

    torBootstrap.bootstrapped = true
    onBootstrapped()
    jest.advanceTimersByTime(request.timeoutMs)
    await expect(handle.result).rejects.toMatchObject({ kind: 'timeout' })
    await handle.drained
  })

  it('uses the Tor bootstrap budget when persisted ownership selects P2P over the requested QSS transport', async () => {
    request.kind = AdmissionKind.MEMBER
    stored = AdmissionTransport.P2P
    let onBootstrapped!: () => void
    const torBootstrap = { bootstrapped: false } as TorBootstrapProvider
    torBootstrap.once = jest.fn((_event: 'bootstrapped', listener: () => void) => {
      onBootstrapped = listener
      return torBootstrap
    })
    const p2pLease = new CommunityLifecycle('community', { torBootstrap } as any, 'wss://qss')
    const handle = coordinator.start(request, p2pLease)
    await flush()

    expect((coordinator as any).activeSession.state.attempt.transport).toBe(AdmissionTransport.P2P)
    expect(torBootstrap.once).toHaveBeenCalledWith('bootstrapped', expect.any(Function))
    expect(coordinator['activeSession']!.deadline).toBeUndefined()
    jest.advanceTimersByTime(request.timeoutMs)
    expect(coordinator['activeSession']!.state.status).toBe('admitting')

    torBootstrap.bootstrapped = true
    onBootstrapped()
    jest.advanceTimersByTime(request.timeoutMs)
    await expect(handle.result).rejects.toMatchObject({ kind: 'timeout' })
    await handle.drained
  })

  it('keeps the original QSS acquisition deadline when device admission falls back to unbootstrapped P2P', async () => {
    const torBootstrap = { bootstrapped: false, once: jest.fn(), off: jest.fn() }
    const fallbackLease = new CommunityLifecycle('community', { torBootstrap } as any, 'wss://qss')
    const handle = coordinator.start(request, fallbackLease)
    await flush()
    const qssDeadlineAt = coordinator['activeSession']!.deadlineAt

    jest.advanceTimersByTime(request.timeoutMs / 2)
    await flush()
    expect(options).toHaveLength(2)
    expect((coordinator as any).activeSession.state.attempt.transport).toBe(AdmissionTransport.P2P)
    expect(torBootstrap.once).not.toHaveBeenCalled()
    expect(coordinator['activeSession']!.deadlineAt).toBe(qssDeadlineAt)

    jest.advanceTimersByTime(request.timeoutMs / 2)
    await expect(handle.result).rejects.toMatchObject({ kind: 'timeout' })
    await handle.drained
  })

  it('times out Tor that never bootstraps and permits a clean retry', async () => {
    const torBootstrap = { bootstrapped: false, once: jest.fn(), off: jest.fn() }
    const stalledLease = new CommunityLifecycle('community', { torBootstrap } as any)
    const handle = coordinator.start({ ...request, preferredTransport: AdmissionTransport.P2P }, stalledLease)
    await flush()
    jest.advanceTimersByTime(ADMISSION_TOR_BOOTSTRAP_TIMEOUT_MS)
    await expect(handle.result).rejects.toMatchObject({ kind: 'timeout' })
    await handle.drained
    expect(torBootstrap.off).toHaveBeenCalledWith('bootstrapped', expect.any(Function))
    expect(commit).not.toHaveBeenCalled()
    const retry = coordinator.start(request, lease)
    await flush()
    await options[1].context.joined(payload())
    await expect(retry.result).resolves.toMatchObject({ teamId: 'team' })
  })

  it.each(['before-commit', 'during-commit'] as const)(
    'reports bounded recovery for a stalled %s without releasing ownership',
    async phase => {
      const pending = deferred()
      const handle = coordinator.start(request, lease)
      await flush()
      if (phase === 'before-commit') void options[0].scope.run(() => pending.promise)
      else commit.mockReturnValueOnce(pending.promise)
      const selected = options[0].context.joined(payload())
      await flush()
      jest.advanceTimersByTime(ADMISSION_DRAIN_TIMEOUT_MS)
      await expect(selected).rejects.toMatchObject({ kind: 'recovery' })
      await expect(handle.drained).rejects.toMatchObject({ kind: 'recovery' })
      expect(() => coordinator.start(request, new CommunityLifecycle('community', {} as any))).toThrow(
        AdmissionBusyError
      )
      expect(discard).not.toHaveBeenCalled()
      pending.resolve()
      await flush()
      expect(commit).toHaveBeenCalledTimes(phase === 'before-commit' ? 0 : 1)
      expect(options[0].context.gate.adopted).toBe(false)
      expect(coordinator['activeSession']!.state.status).toBe('recovery-required')
    }
  )

  it.each(['initial', 'fallback'] as const)('rolls back if staging the %s attempt throws', async phase => {
    if (phase === 'initial')
      stage.mockImplementationOnce(() => {
        throw new Error('cannot fork chain')
      })
    const handle = coordinator.start(request, lease)
    await flush()
    if (phase === 'fallback') {
      stage.mockImplementationOnce(() => {
        throw new Error('cannot fork chain')
      })
      jest.advanceTimersByTime(60_000)
    }
    await expect(handle.result).rejects.toThrow('cannot fork chain')
    await handle.drained
    expect(discard).toHaveBeenCalledTimes(1)
    expect(cleanup).toHaveBeenCalledTimes(phase === 'initial' ? 0 : 1)
    expect(commit).not.toHaveBeenCalled()
    const nextLease = new CommunityLifecycle('community', {} as any)
    const next = coordinator.start(request, nextLease)
    await flush()
    await options[options.length - 1].context.joined(payload())
    await expect(next.result).resolves.toMatchObject({ teamId: 'team' })
    await nextLease.drain(new Error('finished'))
  })

  it.each(['validation', 'persistence'] as const)(
    'drains a failed %s commit when shutdown is already waiting',
    async kind => {
      const pending = deferred()
      commit.mockReturnValueOnce(pending.promise)
      const handle = coordinator.start(request, lease)
      await flush()
      const ack = options[0].context.joined(payload())
      const rejectedAck = expect(ack).rejects.toMatchObject({ kind })
      await flush()
      const shutdown = lease.drain(new Error('shutdown during commit'))
      await flush()
      expect(cleanup).not.toHaveBeenCalled()
      pending.reject(new AdmissionError(kind, 'commit definitively refused'))
      await rejectedAck
      await expect(handle.result).rejects.toMatchObject({ kind })
      await shutdown
      expect(cleanup).toHaveBeenCalledTimes(1)
      expect(discard).toHaveBeenCalledTimes(1)
      expect(options).toHaveLength(1)
      expect(jest.getTimerCount()).toBe(0)
    }
  )

  it('ignores retired-session failures and deadlines while a new admission is active', async () => {
    const old = coordinator.start(request, lease)
    await flush()
    const retired = options[0].context
    jest.advanceTimersByTime(10_000)
    await old.cancel(new Error('retry admission'))
    await expect(old.result).rejects.toThrow('retry admission')
    const nextLease = new CommunityLifecycle('community', {} as any)
    const next = coordinator.start({ ...request, preferredTransport: AdmissionTransport.P2P }, nextLease)
    await flush()
    retired.fail(new AdmissionError('protocol', 'late old socket error'))
    expect(() => retired.joined(payload())).toThrow('closed')
    jest.advanceTimersByTime(110_000)
    await options[1].context.joined(payload())
    await expect(next.result).resolves.toMatchObject({ transport: AdmissionTransport.P2P })
    expect(commit).toHaveBeenCalledTimes(1)
    await nextLease.drain(new Error('finished'))
    expect(cleanup).toHaveBeenCalledTimes(2)
    expect(jest.getTimerCount()).toBe(0)
  })

  it('settles a deadline during hung preparation, fencing ownership until late startup drains', async () => {
    const pending = deferred()
    prepare.mockReturnValueOnce(pending.promise)
    const handle = coordinator.start(request, lease)
    await flush()
    jest.advanceTimersByTime(120_000)
    await expect(handle.result).rejects.toMatchObject({ kind: 'timeout' })
    expect(() => coordinator.start({ ...request, expectedDeviceId: 'other' }, lease)).toThrow(AdmissionBusyError)
    expect(start).not.toHaveBeenCalled()
    pending.resolve()
    await handle.drained
    expect(cleanup).toHaveBeenCalledTimes(1)
    expect(start).not.toHaveBeenCalled()
  })

  it('never starts P2P after cancellation races with its durable ownership write', async () => {
    request.kind = AdmissionKind.MEMBER
    request.preferredTransport = AdmissionTransport.P2P
    const pending = deferred<string>()
    claim.mockReturnValueOnce(pending.promise)
    const handle = coordinator.start(request, lease)
    await flush()
    expect(claim).toHaveBeenCalledTimes(1)
    const reason = new Error('switch community')
    const cancelled = handle.cancel(reason)
    await expect(handle.result).rejects.toBe(reason)
    expect(start).not.toHaveBeenCalled()
    pending.resolve('claimed')
    await cancelled
    expect(start).not.toHaveBeenCalled()
    expect(discard).toHaveBeenCalledTimes(1)
  })

  it('irrevocably disables fallback and cancellation once a candidate starts committing', async () => {
    const pending = deferred()
    commit.mockReturnValueOnce(pending.promise)
    const handle = coordinator.start(request, lease)
    await flush()
    jest.advanceTimersByTime(59_999)
    const candidate = payload()
    const ack = options[0].context.joined(candidate)
    expect(options[0].context.joined(candidate)).toBe(ack)
    await expect(options[0].context.joined(payload())).rejects.toMatchObject({ kind: 'cancelled' })
    await flush()
    const cancel = handle.cancel(new Error('shutdown'))
    options[0].context.fail(new AdmissionError('transport', 'disconnected'))
    jest.advanceTimersByTime(ADMISSION_DRAIN_TIMEOUT_MS - 1)
    expect(options).toHaveLength(1)
    expect(cleanup).not.toHaveBeenCalled()
    pending.resolve()
    await expect(handle.result).resolves.toMatchObject({ transport: AdmissionTransport.QSS })
    await cancel
    await ack
    expect(commit).toHaveBeenCalledTimes(1)
  })

  it('does not acknowledge an unrelated candidate submitted reentrantly from a start effect', async () => {
    synchronousStart = true
    let rejected!: Promise<unknown>
    start.mockImplementationOnce(async () => {
      void options[0].context.joined(payload())
      rejected = options[0].context.joined(payload()).catch(error => error)
    })
    const handle = coordinator.start(request, lease)
    await expect(handle.result).resolves.toMatchObject({ transport: AdmissionTransport.QSS })
    await expect(rejected).resolves.toMatchObject({ kind: 'cancelled' })
    expect(commit).toHaveBeenCalledTimes(1)
  })

  it('transfers a successful commit to a revoked lifecycle without resuming networking', async () => {
    const pending = deferred()
    commit.mockReturnValueOnce(pending.promise)
    const handle = coordinator.start(request, lease)
    await flush()
    const state = coordinator['activeSession']!.state
    if (state.status !== 'admitting') throw new Error('Expected an admitting attempt')
    const resume = jest.spyOn(state.attempt.gate, 'resume')
    const ack = options[0].context.joined(payload())
    await flush()
    const reason = new Error('shutdown during commit')
    lease.revoke(reason)
    const cancelled = handle.cancel(reason)
    pending.resolve()
    await ack
    await cancelled
    await expect(handle.result).resolves.toMatchObject({ transport: AdmissionTransport.QSS })
    expect(resume).not.toHaveBeenCalled()
    await lease.drain(reason)
    expect(cleanup).toHaveBeenCalledTimes(1)
  })

  it('drains QSS before starting device fallback and rejects retired candidates', async () => {
    const pending = deferred()
    cleanup.mockReturnValueOnce(pending.promise)
    const handle = coordinator.start(request, lease)
    await flush()
    jest.advanceTimersByTime(60_000)
    await flush()
    expect(options).toHaveLength(1)
    pending.resolve()
    await flush()
    expect(options).toHaveLength(2)
    expect(() => options[0].context.joined(payload())).toThrow('closed')
    await options[1].context.joined(payload())
    await expect(handle.result).resolves.toMatchObject({ transport: AdmissionTransport.P2P })
  })

  it('keeps a delayed QSS device attempt when it completes before the fallback deadline', async () => {
    const pending = deferred()
    prepare.mockReturnValueOnce(pending.promise)
    const handle = coordinator.start(request, lease)
    await flush()
    expect(options).toHaveLength(1)
    expect(options[0].context.request.preferredTransport).toBe(AdmissionTransport.QSS)

    pending.resolve()
    await flush()
    await options[0].context.joined(payload())
    await expect(handle.result).resolves.toMatchObject({ transport: AdmissionTransport.QSS })
    expect(options).toHaveLength(1)
    expect(commit).toHaveBeenCalledTimes(1)
    expect(cleanup).not.toHaveBeenCalled()
  })

  it('does not start fallback if QSS retirement exhausts the acquisition budget', async () => {
    const pending = deferred()
    cleanup.mockReturnValueOnce(pending.promise)
    const handle = coordinator.start(request, lease)
    await flush()
    jest.advanceTimersByTime(60_000)
    await flush()
    jest.advanceTimersByTime(60_000)
    await expect(handle.result).rejects.toMatchObject({ kind: 'timeout' })
    pending.resolve()
    await handle.drained
    expect(options).toHaveLength(1)
  })

  it('rejects candidate selection after the deadline wins', async () => {
    const handle = coordinator.start(request, lease)
    await flush()
    jest.advanceTimersByTime(120_000)
    expect(() => options[0].context.joined(payload())).toThrow('closed')
    await expect(handle.result).rejects.toMatchObject({ kind: 'timeout' })
    await handle.drained
    expect(commit).not.toHaveBeenCalled()
  })

  it.each([AdmissionTransport.QSS, AdmissionTransport.P2P])(
    'reloads durable %s ownership instead of caller preference',
    async transport => {
      request.kind = AdmissionKind.MEMBER
      stored = transport
      const handle = coordinator.start(request, lease)
      await flush()
      expect((coordinator as any).activeSession.state.attempt.transport).toBe(transport)
      expect(claim).not.toHaveBeenCalled()
      options[0].context.fail(new AdmissionError('availability', 'offline'))
      await expect(handle.result).rejects.toMatchObject({ kind: 'availability' })
      await handle.drained
      expect(options).toHaveLength(1)
    }
  )

  it('allows only one competing member transport to claim, start, and publish', async () => {
    request = { ...request, kind: AdmissionKind.MEMBER, preferredTransport: AdmissionTransport.QSS }
    let claimed: AdmissionTransport | undefined
    claim.mockImplementation((async (_communityId: string, transport: AdmissionTransport) => {
      if (claimed == null) {
        claimed = transport
        return 'claimed'
      }
      return claimed === transport ? 'already-owned' : 'conflict'
    }) as any)

    const competingOptions: AdmissionAttemptOptions[] = []
    const competingStart = jest.fn(async () => undefined)
    const competingAdapter = {
      create: (option: AdmissionAttemptOptions) => {
        competingOptions.push(option)
        option.scope.own(async () => undefined)
        return {
          context: option.context,
          prepare: async () => undefined,
          start: () => option.scope.run(competingStart),
          stop: async (error: Error) => {
            option.context.gate.revoke()
            await option.scope.drain(error)
          },
        }
      },
    }
    const competingCoordinator = new AdmissionCoordinator(
      competingAdapter as any,
      competingAdapter as any,
      { beginAdmission: () => ({ stage, commit, discard }) } as any,
      { getCommunity: load, claimAdmissionTransport: claim } as any,
      new AdmissionClock()
    )
    const competingLease = new CommunityLifecycle('community', {} as any)
    const qss = coordinator.start(request, lease)
    const p2p = competingCoordinator.start({ ...request, preferredTransport: AdmissionTransport.P2P }, competingLease)
    await flush()

    expect(claim).toHaveBeenCalledTimes(2)
    expect(start.mock.calls.length + competingStart.mock.calls.length).toBe(1)
    expect(claimed).toBeDefined()

    const winner = claimed === AdmissionTransport.QSS ? options[0] : competingOptions[0]
    await winner.context.joined(payload())
    await expect(claimed === AdmissionTransport.QSS ? qss.result : p2p.result).resolves.toMatchObject({
      transport: claimed,
    })
    await expect(claimed === AdmissionTransport.QSS ? p2p.result : qss.result).rejects.toMatchObject({
      kind: 'persistence',
    })
    expect(commit).toHaveBeenCalledTimes(1)

    stored = claimed
    const restarted = new AdmissionCoordinator(
      competingAdapter as any,
      competingAdapter as any,
      { beginAdmission: () => ({ stage, commit, discard }) } as any,
      { getCommunity: load, claimAdmissionTransport: claim } as any,
      new AdmissionClock()
    )
    const restartedLease = new CommunityLifecycle('community', {} as any)
    const restartedHandle = restarted.start({ ...request, preferredTransport: AdmissionTransport.P2P }, restartedLease)
    await flush()
    expect((restarted as any).activeSession.state.attempt.transport).toBe(claimed)
    await restartedHandle.cancel(new Error('test complete'))
    await expect(restartedHandle.result).rejects.toThrow('test complete')
  })

  it.each([AdmissionKind.MEMBER, AdmissionKind.DEVICE])(
    'falls back on pre-claim QSS unavailability for %s admission',
    async kind => {
      request.kind = kind
      prepare.mockRejectedValueOnce(new AdmissionError('availability', 'offline'))
      const handle = coordinator.start(request, lease)
      await flush()
      expect(options).toHaveLength(2)
      if (kind === AdmissionKind.MEMBER) expect(claim).toHaveBeenCalledWith('community', AdmissionTransport.P2P)
      else expect(claim).not.toHaveBeenCalled()
      await options[1].context.joined(payload())
      await expect(handle.result).resolves.toMatchObject({ transport: AdmissionTransport.P2P })
    }
  )

  it.each(['validation', 'persistence', 'protocol'] as const)('does not fall back on %s failure', async kind => {
    prepare.mockRejectedValueOnce(new AdmissionError(kind, 'failed'))
    const handle = coordinator.start(request, lease)
    await expect(handle.result).rejects.toMatchObject({ kind })
    await handle.drained
    expect(options).toHaveLength(1)
  })

  it('retains ownership and reports recovery when the write outcome is uncertain', async () => {
    commit.mockRejectedValueOnce(new AdmissionRecoveryRequiredError('uncertain write'))
    const handle = coordinator.start(request, lease)
    await flush()
    await expect(options[0].context.joined(payload())).rejects.toMatchObject({ kind: 'recovery' })
    await expect(handle.result).rejects.toMatchObject({ kind: 'recovery' })
    expect(() => coordinator.start({ ...request, timeoutMs: 1 }, lease)).toThrow(AdmissionBusyError)
    expect(discard).not.toHaveBeenCalled()
    await expect(handle.drained).rejects.toMatchObject({ kind: 'recovery' })
    await expect(lease.pause(new Error('pause'))).rejects.toMatchObject({ kind: 'recovery' })
    await expect(lease.drain(new Error('shutdown'))).rejects.toMatchObject({ kind: 'recovery' })
    expect(cleanup).not.toHaveBeenCalled()
  })

  it('makes a permanently stalled teardown report recovery without releasing its admission', async () => {
    cleanup.mockImplementationOnce(() => new Promise<void>(() => {}))
    const handle = coordinator.start(request, lease)
    await flush()
    const draining = handle.cancel(new Error('cancelled'))
    await expect(handle.result).rejects.toThrow('cancelled')
    await flush()
    jest.advanceTimersByTime(ADMISSION_DRAIN_TIMEOUT_MS)
    await expect(draining).rejects.toMatchObject({ kind: 'recovery' })
    expect(() => coordinator.start(request, new CommunityLifecycle('community', {} as any))).toThrow(AdmissionBusyError)
    expect(commit).not.toHaveBeenCalled()
    expect(discard).not.toHaveBeenCalled()
  })

  it('reports teardown recovery to lifecycle callers without releasing uncertain ownership', async () => {
    cleanup.mockRejectedValueOnce(new Error('cleanup failed'))
    const handle = coordinator.start(request, lease)
    await flush()
    const reason = new Error('shutdown')
    await expect(lease.drain(reason)).rejects.toMatchObject({ kind: 'recovery' })
    await expect(handle.result).rejects.toBe(reason)
    await expect(handle.drained).rejects.toMatchObject({ kind: 'recovery' })
    expect(() => coordinator.start({ ...request, timeoutMs: 1 }, lease)).toThrow(AdmissionBusyError)
    expect(discard).not.toHaveBeenCalled()
  })

  it('deduplicates normalized requests and rejects changed configuration', async () => {
    const handle = coordinator.start(request, lease)
    expect(coordinator.start({ ...request }, lease)).toBe(handle)
    expect(() => coordinator.start({ ...request, timeoutMs: 1 }, lease)).toThrow(AdmissionBusyError)
    expect(() => coordinator.start(request, new CommunityLifecycle('community', {} as any))).toThrow(AdmissionBusyError)
    await handle.cancel(new Error('cancel immediately'))
    await expect(handle.result).rejects.toThrow('cancel immediately')
    expect(start).not.toHaveBeenCalled()
  })

  it('rejects a late candidate after reset while transport startup is still pending', async () => {
    const pending = deferred()
    start.mockReturnValueOnce(pending.promise)
    const handle = coordinator.start({ ...request, preferredTransport: AdmissionTransport.P2P }, lease)
    await flush()
    expect(start).toHaveBeenCalledTimes(1)

    const reason = new Error('reset admission')
    const reset = lease.drain(reason)
    await expect(handle.result).rejects.toBe(reason)
    pending.resolve()
    await reset

    expect(() => options[0].context.joined(payload())).toThrow('closed')
    expect(commit).not.toHaveBeenCalled()
    expect(cleanup).toHaveBeenCalledTimes(1)
  })
})
