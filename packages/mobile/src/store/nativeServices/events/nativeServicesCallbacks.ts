import { eventChannel } from 'redux-saga'
import { call, put, take } from 'typed-redux-saga'
import { publicChannels, WEBSOCKET_CONNECTION_CHANNEL } from '@quiet/state-manager'
import { initActions, WebsocketConnectionPayload } from '../../init/init.slice'
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

export interface BackendEvent {
  channelName: string
  payload: string
}

export const deviceEvents = () => {
  return eventChannel<
  | ReturnType<typeof initActions.startWebsocketConnection>
  | ReturnType<typeof initActions.setCurrentScreen>
  | ReturnType<typeof publicChannels.actions.setCurrentChannel>
  >(emit => {
    const subscriptions = [
      nativeEventEmitter?.addListener(
        NativeEventKeys.Backend,
        (event: BackendEvent) => {
          if (event.channelName === WEBSOCKET_CONNECTION_CHANNEL) {
            const payload: WebsocketConnectionPayload = JSON.parse(event.payload)
            emit(initActions.startWebsocketConnection(payload))
          }
        }
      ),
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
