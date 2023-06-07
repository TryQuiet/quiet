import { eventChannel } from 'redux-saga'
import { call, put, take } from 'typed-redux-saga'
import {
  app,
  publicChannels,
  WEBSOCKET_CONNECTION_CHANNEL,
  INIT_CHECK_CHANNEL,
} from '@quiet/state-manager'
import { initActions, InitCheckPayload, WebsocketConnectionPayload } from '../../init/init.slice'
import { ScreenNames } from '../../../const/ScreenNames.enum'
import { NativeEventKeys } from './nativeEvent.keys'
import nativeEventEmitter from './nativeEventEmitter'
import { navigationActions } from '../../navigation/navigation.slice'

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
    | ReturnType<typeof initActions.updateInitCheck>
    | ReturnType<typeof navigationActions.navigation>
    | ReturnType<typeof publicChannels.actions.setCurrentChannel>
    | ReturnType<typeof app.actions.stopBackend>
  >(emit => {
    const subscriptions = [
      nativeEventEmitter?.addListener(NativeEventKeys.Backend, (event: BackendEvent) => {
        if (event.channelName === WEBSOCKET_CONNECTION_CHANNEL) {
          let payload: WebsocketConnectionPayload | null = null
          if (typeof event.payload !== 'object') {
            payload = JSON.parse(event.payload)
          } else {
            // iOS sends object without having to parse with JSON
            payload = event.payload
          }
          if (payload) {
            emit(initActions.startWebsocketConnection(payload))
          }
        }
        if (event.channelName === INIT_CHECK_CHANNEL) {
          const payload: InitCheckPayload = JSON.parse(event.payload)
          emit(initActions.updateInitCheck(payload))
        }
      }),
      nativeEventEmitter?.addListener(NativeEventKeys.Notification, (channelId: string) => {
        // Change data source in state-manager
        emit(publicChannels.actions.setCurrentChannel({ channelId }))
        // Redirect to proper screen in the application
        emit(navigationActions.navigation({ screen: ScreenNames.ChannelScreen }))
      }),
      nativeEventEmitter?.addListener(NativeEventKeys.Stop, () => {
        emit(app.actions.stopBackend())
      })
    ]
    return () => {
      subscriptions.forEach(subscription => subscription?.remove())
    }
  })
}
