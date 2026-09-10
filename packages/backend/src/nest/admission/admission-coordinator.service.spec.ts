import { jest } from '@jest/globals'
import { AdmissionCoordinator } from './admission-coordinator.service'
import { AdmissionClock } from './admission-clock'
import { AdmissionLifecycle } from './admission-lifecycle'
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
  let lease: AdmissionLifecycle
  let options: AdmissionAttemptOptions[]
  let prepare: ReturnType<typeof jest.fn<() => Promise<void>>>
  let start: ReturnType<typeof jest.fn<() => Promise<void>>>
  let cleanup: ReturnType<typeof jest.fn<() => Promise<void>>>
  let commit: ReturnType<typeof jest.fn<() => Promise<void>>>
  let claim: ReturnType<typeof jest.fn<() => Promise<string>>>
  let stored: AdmissionTransport | undefined
  let synchronousStart: boolean
  let discard: ReturnType<typeof jest.fn>

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
    lease = new AdmissionLifecycle('community', 1, {} as any, 'wss://qss')
    options = []
    stored = undefined
    synchronousStart = false
    prepare = jest.fn(async () => undefined)
    start = jest.fn(async () => undefined)
    cleanup = jest.fn(async () => undefined)
    commit = jest.fn(async () => undefined)
    claim = jest.fn(async () => 'claimed')
    discard = jest.fn()
    const adapter = {
      create: (option: AdmissionAttemptOptions) => {
        options.push(option)
        option.scope.own(cleanup)
        return {
          context: option.context,
          prepare: () => option.scope.run(prepare),
          start: () => (synchronousStart ? start() : option.scope.run(start)),
          stop: (error: Error) => {
            option.context.revoke()
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
        beginAdmission: () => ({ stage: () => ({ device: { deviceId: 'device' } }), commit, discard }),
      } as any,
      { getCommunity: async () => ({ admissionTransport: stored }), claimAdmissionTransport: claim } as any,
      clock
    )
  })
  afterEach(() => jest.useRealTimers())
  const payload = () => ({ team: { id: 'team' } as any, user: { userId: 'user' } as any })

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
    jest.advanceTimersByTime(200_000)
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
    const resume = jest.spyOn(options[0].context, 'resume')
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
      expect(options[0].context.transport).toBe(transport)
      expect(claim).not.toHaveBeenCalled()
      options[0].context.fail(new AdmissionError('availability', 'offline'))
      await expect(handle.result).rejects.toMatchObject({ kind: 'availability' })
      await handle.drained
      expect(options).toHaveLength(1)
    }
  )

  it('allows member fallback only for classified pre-claim unavailability', async () => {
    request.kind = AdmissionKind.MEMBER
    prepare.mockRejectedValueOnce(new AdmissionError('availability', 'offline'))
    const handle = coordinator.start(request, lease)
    await flush()
    expect(options).toHaveLength(2)
    expect(claim).toHaveBeenCalledWith('community', AdmissionTransport.P2P)
    await options[1].context.joined(payload())
    await expect(handle.result).resolves.toMatchObject({ transport: AdmissionTransport.P2P })
  })

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
  })

  it('deduplicates normalized requests and rejects changed configuration', async () => {
    const handle = coordinator.start(request, lease)
    expect(coordinator.start({ ...request }, lease)).toBe(handle)
    expect(() => coordinator.start({ ...request, timeoutMs: 1 }, lease)).toThrow(AdmissionBusyError)
    expect(() => coordinator.start(request, new AdmissionLifecycle('community', 2, {} as any))).toThrow(
      AdmissionBusyError
    )
    await handle.cancel(new Error('cancel immediately'))
    await expect(handle.result).rejects.toThrow('cancel immediately')
    expect(start).not.toHaveBeenCalled()
  })
})
