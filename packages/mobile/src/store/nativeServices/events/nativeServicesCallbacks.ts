import { eventChannel } from 'redux-saga'
import { call, put, take } from 'typed-redux-saga'
import { publicChannels } from '@quiet/state-manager'
import { initActions } from '../../init/init.slice'
import { ScreenNames } from '../../../const/ScreenNames.enum'
import { NativeEventKeys } from './nativeEvent.keys'
import nativeEventEmitter from './nativeEventEmitter'

export function* nativeServicesCallbacksSaga(): Generator {
  const channel = yield* call(deviceEvents)
  while (true) {
    const action = yield* take(channel)
    yield put(action)
  }
}

export const deviceEvents = () => {
  return eventChannel<
  | ReturnType<typeof initActions.setCurrentScreen>
  | ReturnType<typeof publicChannels.actions.setCurrentChannel>
  >(emit => {
    const subscriptions = [
      nativeEventEmitter?.addListener(
        NativeEventKeys.Notification,
        (channelAddress: string) => {
          // Change data source in state-manager
          emit(publicChannels.actions.setCurrentChannel({ channelAddress }))
          // Redirect to proper screen in the application
          emit(initActions.setCurrentScreen(ScreenNames.ChannelScreen))
        }
      )
    ]
    return () => {
      subscriptions.forEach(subscription => subscription?.remove())
    }
  })
}
