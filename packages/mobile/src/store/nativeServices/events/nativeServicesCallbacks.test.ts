import { initActions } from '../../init/init.slice'
import { network } from '@quiet/state-manager'
import { NativeModules, Platform } from 'react-native'
import { runSaga } from 'redux-saga'
import { NativeEventKeys } from './nativeEvent.keys'
import { nativeServicesActions } from '../nativeServices.slice'

const mockListeners = new Map<string, (...args: any[]) => void>()
const mockRemove = jest.fn()

jest.mock('./nativeEventEmitter', () => ({
  __esModule: true,
  default: {
    addListener: jest.fn((event: string, listener: (...args: any[]) => void) => {
      mockListeners.set(event, listener)
      return { remove: mockRemove }
    }),
  },
}))

import { deviceEvents, nativeServicesCallbacksSaga } from './nativeServicesCallbacks'

const takeFromChannel = <T>(channel: { take: (callback: (input: T) => void) => void }): Promise<T> =>
  new Promise(resolve => channel.take(resolve))

describe('deviceEvents', () => {
  const originalPlatform = Platform.OS

  beforeEach(() => {
    Platform.OS = 'ios'
    mockListeners.clear()
    mockRemove.mockClear()
    NativeModules.CommunicationModule.setPauseListenerReady.mockReset()
    NativeModules.CommunicationModule.setLifecycleListenerReady.mockReset()
  })

  afterEach(() => {
    Platform.OS = originalPlatform
  })

  it.each(['ios', 'android'] as const)('subscribes only to supported lifecycle events on %s', async platform => {
    Platform.OS = platform
    const channel = deviceEvents()
    const resumed = takeFromChannel(channel)

    expect(mockListeners.has(NativeEventKeys.AppBackground)).toBe(platform === 'android')
    mockListeners.get(NativeEventKeys.AppResume)?.()

    await expect(resumed).resolves.toEqual(initActions.resumeWebsocketConnection())

    channel.close()
    expect(mockRemove).toHaveBeenCalledTimes(platform === 'android' ? 6 : 5)
  })

  it('flushes Android background state without clearing initialized communities or suspending the socket', async () => {
    Platform.OS = 'android'
    const dispatch = jest.fn()
    const task = runSaga({ dispatch }, nativeServicesCallbacksSaga)

    mockListeners.get(NativeEventKeys.AppBackground)?.()
    mockListeners.get(NativeEventKeys.AppResume)?.()

    expect(dispatch.mock.calls.map(([action]) => action)).toEqual([
      nativeServicesActions.flushPersistor({}),
      initActions.resumeWebsocketConnection(),
    ])
    task.cancel()
    await task.toPromise()
  })

  it.each([NativeEventKeys.AppResume, NativeEventKeys.AppBackground])(
    'receives Android %s during listener readiness and unregisters on cancellation',
    async event => {
      Platform.OS = 'android'
      const dispatch = jest.fn()
      NativeModules.CommunicationModule.setLifecycleListenerReady.mockImplementation((ready: boolean) => {
        if (ready) mockListeners.get(event)?.()
      })
      const task = runSaga({ dispatch }, nativeServicesCallbacksSaga)

      expect(dispatch).toHaveBeenCalledWith(
        event === NativeEventKeys.AppResume
          ? initActions.resumeWebsocketConnection()
          : nativeServicesActions.flushPersistor({})
      )
      task.cancel()
      await task.toPromise()
      expect(NativeModules.CommunicationModule.setLifecycleListenerReady).toHaveBeenLastCalledWith(false)
    }
  )

  it('forwards the pause transition ID and queues persistence plus background cleanup', async () => {
    const channel = deviceEvents()
    const flush = takeFromChannel(channel)

    mockListeners.get(NativeEventKeys.AppPause)?.({ transitionId: 'pause-1', isBackground: true })

    await expect(flush).resolves.toEqual(nativeServicesActions.flushPersistor({ transitionId: 'pause-1' }))
    await expect(takeFromChannel(channel)).resolves.toEqual(network.actions.removeInitializedCommunities())
    channel.close()
  })

  it('ignores duplicate transition IDs and skips stale foreground cleanup', async () => {
    const channel = deviceEvents()
    const flush = takeFromChannel(channel)

    mockListeners.get(NativeEventKeys.AppPause)?.({ transitionId: 'pause-2', isBackground: false })
    mockListeners.get(NativeEventKeys.AppPause)?.({ transitionId: 'pause-2', isBackground: false })

    await expect(flush).resolves.toEqual(nativeServicesActions.flushPersistor({ transitionId: 'pause-2' }))
    let receivedAnotherAction = false
    channel.take(() => {
      receivedAnotherAction = true
    })
    await Promise.resolve()
    expect(receivedAnotherAction).toBe(false)
    channel.close()
  })

  it('marks the native pause listener ready after subscription and clears readiness on cancellation', async () => {
    const task = runSaga({ dispatch: jest.fn() }, nativeServicesCallbacksSaga)
    await Promise.resolve()

    expect(mockListeners.has(NativeEventKeys.AppPause)).toBe(true)
    expect(NativeModules.CommunicationModule.setPauseListenerReady).toHaveBeenCalledWith(true)

    task.cancel()
    await task.toPromise()
    expect(NativeModules.CommunicationModule.setPauseListenerReady).toHaveBeenLastCalledWith(false)
  })

  it('receives a startup pause replayed synchronously when readiness is announced', async () => {
    const dispatch = jest.fn()
    NativeModules.CommunicationModule.setPauseListenerReady.mockImplementation((ready: boolean) => {
      if (ready) mockListeners.get(NativeEventKeys.AppPause)?.({ transitionId: 'startup-pause', isBackground: true })
    })

    const task = runSaga({ dispatch }, nativeServicesCallbacksSaga)
    await Promise.resolve()
    await Promise.resolve()

    expect(dispatch).toHaveBeenCalledWith(nativeServicesActions.flushPersistor({ transitionId: 'startup-pause' }))
    expect(dispatch).toHaveBeenCalledWith(network.actions.removeInitializedCommunities())
    task.cancel()
    await task.toPromise()
  })
})
