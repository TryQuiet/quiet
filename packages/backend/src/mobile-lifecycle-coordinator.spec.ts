import { jest } from '@jest/globals'

import { MobileLifecycleCoordinator } from './mobile-lifecycle-coordinator'
import type { OpenServices } from './options'

const deferred = <T>() => {
  let resolve!: (value: T | PromiseLike<T>) => void
  let reject!: (reason?: unknown) => void
  const promise = new Promise<T>((promiseResolve, promiseReject) => {
    resolve = promiseResolve
    reject = promiseReject
  })
  return { promise, reject, resolve }
}

const services = (authCookie: string): OpenServices => ({
  authCookie,
  httpTunnelPort: 12_345,
  torControlPort: 23_456,
})

describe('MobileLifecycleCoordinator', () => {
  it('serializes active behind an in-flight pause', async () => {
    const pauseDeferred = deferred<void>()
    const pause = jest.fn(() => pauseDeferred.promise)
    const activate = jest.fn(async (_services: OpenServices) => undefined)
    const coordinator = new MobileLifecycleCoordinator({ activate, pause })

    const pauseRequest = coordinator.pause()
    const activeRequest = coordinator.activate(services('cookie-a'))

    expect(pause).toHaveBeenCalledTimes(1)
    expect(activate).not.toHaveBeenCalled()

    pauseDeferred.resolve()
    await Promise.all([pauseRequest, activeRequest])

    expect(activate).toHaveBeenCalledTimes(1)
    expect(activate).toHaveBeenCalledWith(services('cookie-a'))
  })

  it('coalesces pause-active-pause to the final paused intent', async () => {
    const pauseDeferred = deferred<void>()
    const pause = jest.fn(() => pauseDeferred.promise)
    const activate = jest.fn(async (_services: OpenServices) => undefined)
    const coordinator = new MobileLifecycleCoordinator({ activate, pause })

    const firstPause = coordinator.pause()
    const active = coordinator.activate(services('cookie-a'))
    const finalPause = coordinator.pause()

    pauseDeferred.resolve()
    await Promise.all([firstPause, active, finalPause])

    expect(pause).toHaveBeenCalledTimes(1)
    expect(activate).not.toHaveBeenCalled()
  })

  it('applies the newest active payload and skips an obsolete pause', async () => {
    const firstActiveDeferred = deferred<void>()
    const pause = jest.fn(async () => undefined)
    const activate = jest.fn((payload: OpenServices) => {
      if (payload.authCookie === 'cookie-a') {
        return firstActiveDeferred.promise
      }
      return Promise.resolve()
    })
    const coordinator = new MobileLifecycleCoordinator({ activate, pause })

    const firstActive = coordinator.activate(services('cookie-a'))
    const pauseRequest = coordinator.pause()
    const latestActive = coordinator.activate(services('cookie-b'))

    expect(activate).toHaveBeenCalledTimes(1)
    firstActiveDeferred.resolve()
    await Promise.all([firstActive, pauseRequest, latestActive])

    expect(pause).not.toHaveBeenCalled()
    expect(activate).toHaveBeenCalledTimes(2)
    expect(activate).toHaveBeenNthCalledWith(1, services('cookie-a'))
    expect(activate).toHaveBeenNthCalledWith(2, services('cookie-b'))
  })

  it('applies a queued newer intent before reporting an earlier failure', async () => {
    const error = new Error('pause failed')
    const pauseDeferred = deferred<void>()
    const pause = jest.fn(() => pauseDeferred.promise)
    const activate = jest.fn(async (_services: OpenServices) => undefined)
    const coordinator = new MobileLifecycleCoordinator({ activate, pause })

    const pauseRequest = coordinator.pause()
    const activeRequest = coordinator.activate(services('cookie-b'))
    const requestsSettled = Promise.allSettled([pauseRequest, activeRequest])

    pauseDeferred.reject(error)
    const results = await requestsSettled

    expect(activate).toHaveBeenCalledTimes(1)
    expect(activate).toHaveBeenCalledWith(services('cookie-b'))
    expect(results).toEqual([
      { reason: error, status: 'rejected' },
      { reason: error, status: 'rejected' },
    ])
  })

  it('recovers after a rejected transition', async () => {
    const error = new Error('pause failed')
    const pause = jest.fn<() => Promise<void>>().mockRejectedValueOnce(error).mockResolvedValueOnce(undefined)
    const activate = jest.fn(async (_services: OpenServices) => undefined)
    const coordinator = new MobileLifecycleCoordinator({ activate, pause })

    await expect(coordinator.pause()).rejects.toThrow(error)
    await coordinator.pause()

    expect(pause).toHaveBeenCalledTimes(2)
  })
})
