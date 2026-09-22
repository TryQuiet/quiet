import { clearCommunityWithDependencies, createClearCommunity } from './clearCommunity'

const createDeferred = <T = void>() => {
  let resolve!: (value: T | PromiseLike<T>) => void
  let reject!: (reason?: unknown) => void
  const promise = new Promise<T>((promiseResolve, promiseReject) => {
    resolve = promiseResolve
    reject = promiseReject
  })
  return { promise, resolve, reject }
}

describe('clearCommunityWithDependencies', () => {
  it('shares one backend leave and one renderer reset through the entire persistence purge', async () => {
    const backendLeave = createDeferred<boolean>()
    const purge = createDeferred<void>()
    const deps = {
      persistor: {
        pause: jest.fn(),
        flush: jest.fn(async () => {}),
        purge: jest.fn(() => purge.promise),
        persist: jest.fn(),
      },
      dispatch: jest.fn(),
      resetAppAction: { type: 'Communities/resetApp' },
      requestBackendLeave: jest.fn(() => backendLeave.promise),
      remountRoot: jest.fn(),
    }
    const clear = createClearCommunity(deps)
    const first = clear()
    expect(clear()).toBe(first)
    backendLeave.resolve(true)
    await Promise.resolve()
    await Promise.resolve()
    expect(deps.persistor.purge).toHaveBeenCalledTimes(1)
    expect(clear()).toBe(first)
    expect(deps.requestBackendLeave).toHaveBeenCalledTimes(1)
    expect(deps.remountRoot).not.toHaveBeenCalled()
    purge.resolve()
    await first
    expect(deps.dispatch).toHaveBeenCalledTimes(1)
    expect(deps.remountRoot).toHaveBeenCalledTimes(1)
    expect(deps.persistor.persist).toHaveBeenCalledTimes(1)
  })

  it('allows a retry after failed backend cleanup or persistence without leaving persistence paused', async () => {
    const deps = {
      persistor: {
        pause: jest.fn(),
        flush: jest.fn(async () => {}),
        purge: jest.fn().mockRejectedValueOnce(new Error('purge failed')).mockResolvedValue(undefined),
        persist: jest.fn(),
      },
      dispatch: jest.fn(),
      resetAppAction: { type: 'Communities/resetApp' },
      requestBackendLeave: jest.fn().mockResolvedValueOnce(false).mockResolvedValue(true),
      remountRoot: jest.fn(),
    }
    const clear = createClearCommunity(deps)
    await expect(clear()).rejects.toThrow('Backend failed to leave community')
    expect(deps.persistor.pause).not.toHaveBeenCalled()
    await expect(clear()).rejects.toThrow('purge failed')
    expect(deps.persistor.persist).toHaveBeenCalledTimes(1)
    expect(deps.remountRoot).not.toHaveBeenCalled()
    await clear()
    expect(deps.remountRoot).toHaveBeenCalledTimes(1)
    expect(deps.persistor.persist).toHaveBeenCalledTimes(2)
  })

  it('waits for backend leave before clearing renderer state so late old-community events cannot leak into the next community', async () => {
    const backendLeave = createDeferred<boolean>()
    const events: string[] = []
    const resetAppAction = { type: 'Communities/resetApp' }
    const staleOldChannels = ['general_old-community', 'test_old-community']
    const state = {
      channels: ['general_old-community', 'test_old-community'],
      deletionMessages: [] as string[],
    }

    const persistor = {
      pause: jest.fn(() => events.push('pause')),
      flush: jest.fn(async () => {
        events.push('flush')
      }),
      purge: jest.fn(async () => {
        events.push('purge')
      }),
      persist: jest.fn(() => events.push('persist')),
    }
    const dispatch = jest.fn(action => {
      events.push((action as { type: string }).type)
      if (action === resetAppAction) {
        state.channels = []
      }
    })
    const requestBackendLeave = jest.fn(() => {
      events.push('requestBackendLeave')
      state.channels.push(...staleOldChannels)
      return backendLeave.promise
    })
    const remountRoot = jest.fn(() => events.push('remountRoot'))

    const clearCommunity = clearCommunityWithDependencies({
      persistor,
      dispatch,
      resetAppAction,
      requestBackendLeave,
      remountRoot,
    })

    expect(requestBackendLeave).toHaveBeenCalledTimes(1)
    expect(persistor.pause).not.toHaveBeenCalled()
    expect(persistor.flush).not.toHaveBeenCalled()
    expect(persistor.purge).not.toHaveBeenCalled()
    expect(dispatch).not.toHaveBeenCalled()
    expect(remountRoot).not.toHaveBeenCalled()

    backendLeave.resolve(true)
    await clearCommunity

    const newCommunityDatabaseChannels = ['general_new-community']
    for (const channelId of state.channels) {
      if (!newCommunityDatabaseChannels.includes(channelId)) {
        state.deletionMessages.push(`Deleted #${channelId}`)
      }
    }

    expect(events.indexOf('requestBackendLeave')).toBeLessThan(events.indexOf(resetAppAction.type))
    expect(state.channels).toEqual([])
    expect(state.deletionMessages).toEqual([])
  })

  it('does not clear renderer state when backend leave fails', async () => {
    const persistor = {
      pause: jest.fn(),
      flush: jest.fn(),
      purge: jest.fn(),
      persist: jest.fn(),
    }
    const dispatch = jest.fn()
    const remountRoot = jest.fn()

    await expect(
      clearCommunityWithDependencies({
        persistor,
        dispatch,
        resetAppAction: { type: 'Communities/resetApp' },
        requestBackendLeave: jest.fn(async () => false),
        remountRoot,
      })
    ).rejects.toThrow('Backend failed to leave community')

    expect(persistor.pause).not.toHaveBeenCalled()
    expect(persistor.flush).not.toHaveBeenCalled()
    expect(persistor.purge).not.toHaveBeenCalled()
    expect(dispatch).not.toHaveBeenCalled()
    expect(remountRoot).not.toHaveBeenCalled()
    expect(persistor.persist).not.toHaveBeenCalled()
  })
})
