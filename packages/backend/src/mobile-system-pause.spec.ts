import { EventEmitter } from 'events'
import { jest } from '@jest/globals'

import { registerMobileSystemPause } from './mobile-system-pause'
import { MobileLifecycleCoordinator } from './mobile-lifecycle-coordinator'
import type { SystemEventLock } from './rn-bridge'

const deferred = <T>() => {
  let resolve!: (value: T | PromiseLike<T>) => void
  let reject!: (reason?: unknown) => void
  const promise = new Promise<T>((promiseResolve, promiseReject) => {
    resolve = promiseResolve
    reject = promiseReject
  })
  return { promise, reject, resolve }
}

const nextImmediate = async (): Promise<void> => new Promise(resolve => setImmediate(resolve))

describe('registerMobileSystemPause', () => {
  it('awaits backend pause before releasing the system event lock', async () => {
    const channel = new EventEmitter()
    const pauseDeferred = deferred<void>()
    const pause = jest.fn(() => pauseDeferred.promise)
    const release = jest.fn()

    registerMobileSystemPause(channel, { pause }, { error: jest.fn() })
    channel.emit('pause', { eventId: 'pause-success', release } as unknown as SystemEventLock)
    await nextImmediate()

    expect(pause).toHaveBeenCalledTimes(1)
    expect(release).not.toHaveBeenCalled()

    pauseDeferred.resolve()
    await nextImmediate()

    expect(release).toHaveBeenCalledTimes(1)
  })

  it('releases exactly once and logs safe context when backend pause fails', async () => {
    const channel = new EventEmitter()
    const failure = new Error('credential-sentinel')
    const pause = jest.fn<() => Promise<void>>().mockRejectedValue(failure)
    const release = jest.fn()
    const error = jest.fn()

    registerMobileSystemPause(channel, { pause }, { error })
    channel.emit('pause', { eventId: 'pause-failure', release } as unknown as SystemEventLock)
    await nextImmediate()

    expect(release).toHaveBeenCalledTimes(1)
    expect(error).toHaveBeenCalledWith('Mobile system pause participant failed', {
      participant: 'backend',
      eventId: 'pause-failure',
      errorType: 'Error',
    })
    expect(JSON.stringify(error.mock.calls)).not.toContain('credential-sentinel')
  })

  it('invokes backend pause once for each authoritative system pause', async () => {
    const channel = new EventEmitter()
    const pause = jest.fn(async () => undefined)

    registerMobileSystemPause(channel, { pause }, { error: jest.fn() })
    channel.emit('close')
    channel.emit('pause', { release: jest.fn() } as unknown as SystemEventLock)
    await nextImmediate()

    expect(pause).toHaveBeenCalledTimes(1)
  })

  it('reaches a newer foreground intent before releasing the pause lock', async () => {
    const channel = new EventEmitter()
    const pauseDeferred = deferred<void>()
    const pause = jest.fn(() => pauseDeferred.promise)
    const activate = jest.fn(async () => undefined)
    const lifecycle = new MobileLifecycleCoordinator({ pause, activate })
    const release = jest.fn()

    registerMobileSystemPause(channel, lifecycle, { error: jest.fn() })
    channel.emit('pause', { eventId: 'pause-resume', release } as unknown as SystemEventLock)
    const resume = lifecycle.resume()

    pauseDeferred.resolve()
    await resume
    await nextImmediate()

    expect(pause).toHaveBeenCalledTimes(1)
    expect(activate).toHaveBeenCalledTimes(1)
    expect(release).toHaveBeenCalledTimes(1)
  })

  it('reaches a newer foreground intent and releases when pause fails', async () => {
    const channel = new EventEmitter()
    const pauseDeferred = deferred<void>()
    const pause = jest.fn(() => pauseDeferred.promise)
    const activate = jest.fn(async () => undefined)
    const lifecycle = new MobileLifecycleCoordinator({ pause, activate })
    const release = jest.fn()
    const error = jest.fn()

    registerMobileSystemPause(channel, lifecycle, { error })
    channel.emit('pause', { eventId: 'failed-pause-resume', release } as unknown as SystemEventLock)
    const resume = lifecycle.resume()

    pauseDeferred.reject(new Error('pause failed'))
    await expect(resume).rejects.toThrow('pause failed')
    await nextImmediate()

    expect(activate).toHaveBeenCalledTimes(1)
    expect(release).toHaveBeenCalledTimes(1)
    expect(error).toHaveBeenCalledWith('Mobile system pause participant failed', {
      participant: 'backend',
      eventId: 'failed-pause-resume',
      errorType: 'Error',
    })
  })
})
