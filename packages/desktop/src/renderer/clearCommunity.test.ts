import { clearCommunityWithDependencies } from './clearCommunity'

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
  it('waits for backend leave before clearing renderer state so late old-community events cannot leak into the next community', async () => {
    const backendLeave = createDeferred()
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

    await Promise.resolve()
    await Promise.resolve()
    backendLeave.resolve()
    await clearCommunity

    const newCommunityDatabaseChannels = ['general_new-community']
    for (const channelId of state.channels) {
      if (!newCommunityDatabaseChannels.includes(channelId)) {
        state.deletionMessages.push(`Deleted #${channelId.slice(0, channelId.indexOf('_'))}`)
      }
    }

    expect(events.indexOf('requestBackendLeave')).toBeLessThan(events.indexOf(resetAppAction.type))
    expect(state.channels).toEqual([])
    expect(state.deletionMessages).toEqual([])
  })
})
