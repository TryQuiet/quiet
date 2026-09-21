import { NativeModules } from 'react-native'
import { runSaga } from 'redux-saga'
import { persistor } from '../../store'
import { nativeServicesActions } from '../nativeServices.slice'
import { flushPersistorSaga } from './flushPersistor.saga'

describe('flushPersistorSaga', () => {
  beforeEach(() => {
    NativeModules.CommunicationModule.completeAppPause.mockReset()
  })

  it('acknowledges success only after the persistence flush settles', async () => {
    let resolveFlush: () => void = () => undefined
    const flush = jest.spyOn(persistor, 'flush').mockImplementation(
      () =>
        new Promise<void>(resolve => {
          resolveFlush = resolve
        }) as ReturnType<typeof persistor.flush>
    )

    const task = runSaga({}, flushPersistorSaga, nativeServicesActions.flushPersistor({ transitionId: 'pause-1' }))
    await Promise.resolve()
    expect(NativeModules.CommunicationModule.completeAppPause).not.toHaveBeenCalled()

    resolveFlush()
    await task.toPromise()
    expect(flush).toHaveBeenCalledTimes(1)
    expect(NativeModules.CommunicationModule.completeAppPause).toHaveBeenCalledWith('pause-1', true)
  })

  it('acknowledges failure after a rejected persistence flush', async () => {
    jest.spyOn(persistor, 'flush').mockRejectedValue(new Error('storage unavailable'))

    await runSaga({}, flushPersistorSaga, nativeServicesActions.flushPersistor({ transitionId: 'pause-2' })).toPromise()

    expect(NativeModules.CommunicationModule.completeAppPause).toHaveBeenCalledWith('pause-2', false)
  })

  it('waits for the persistence flush to settle after saga cancellation before acknowledging once', async () => {
    let resolveFlush: () => void = () => undefined
    jest.spyOn(persistor, 'flush').mockImplementation(
      () =>
        new Promise<void>(resolve => {
          resolveFlush = resolve
        }) as ReturnType<typeof persistor.flush>
    )
    const task = runSaga({}, flushPersistorSaga, nativeServicesActions.flushPersistor({ transitionId: 'pause-3' }))
    await Promise.resolve()

    task.cancel()
    await task.toPromise()

    expect(NativeModules.CommunicationModule.completeAppPause).not.toHaveBeenCalled()
    resolveFlush()
    await Promise.resolve()
    await Promise.resolve()

    expect(NativeModules.CommunicationModule.completeAppPause).toHaveBeenCalledTimes(1)
    expect(NativeModules.CommunicationModule.completeAppPause).toHaveBeenCalledWith('pause-3', true)
  })

  it('keeps the Android legacy pause path without a native acknowledgment', async () => {
    jest.spyOn(persistor, 'flush').mockResolvedValue(undefined)

    await runSaga({}, flushPersistorSaga, nativeServicesActions.flushPersistor({})).toPromise()

    expect(NativeModules.CommunicationModule.completeAppPause).not.toHaveBeenCalled()
  })
})
