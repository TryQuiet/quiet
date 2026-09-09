import { buffers, eventChannel, EventChannel } from 'redux-saga'
import { NativeModules } from 'react-native'
import { call, put, take, cancelled } from 'typed-redux-saga'
import { app, publicChannels, WEBSOCKET_CONNECTION_CHANNEL, INIT_CHECK_CHANNEL, network } from '@quiet/state-manager'
import { initActions, InitCheckPayload, WebsocketConnectionPayload } from '../../init/init.slice'
import { ScreenNames } from '../../../const/ScreenNames.enum'
import { NativeEventKeys } from './nativeEvent.keys'
import nativeEventEmitter from './nativeEventEmitter'
import { navigationActions } from '../../navigation/navigation.slice'
import { nativeServicesActions } from '../nativeServices.slice'
import { createLogger } from '../../../utils/logger'
import { AppPauseEvent, BackendEvent, NativeServicesEventAction } from './nativeServicesCallbacks.types'

const logger = createLogger('nativeServicesCallbacks')

export function* nativeServicesCallbacksSaga(): Generator {
  logger.info('nativeServicesCallbacksSaga starting')
  let channel: EventChannel<NativeServicesEventAction> | undefined
  try {
    channel = yield* call(deviceEvents)
    const setPauseListenerReady = NativeModules.CommunicationModule?.setPauseListenerReady
    if (setPauseListenerReady) {
      yield* call([NativeModules.CommunicationModule, setPauseListenerReady], true)
    }
    while (true) {
      const action = yield* take(channel)
      yield put(action)
    }
  } finally {
    channel?.close()
    const setPauseListenerReady = NativeModules.CommunicationModule?.setPauseListenerReady
    if (setPauseListenerReady) {
      yield* call([NativeModules.CommunicationModule, setPauseListenerReady], false)
    }
    logger.info('nativeServicesCallbacksSaga stopping')
    if (yield cancelled()) {
      logger.info('nativeServicesCallbacksSaga cancelled')
    }
  }
}

export const deviceEvents = (): EventChannel<NativeServicesEventAction> => {
  const handledPauseTransitions = new Set<string>()
  const handledPauseTransitionOrder: string[] = []
  return eventChannel<NativeServicesEventAction>(emit => {
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
        // If app has been opened from push notification, remember channel destination and navigate to it after the navigation component becomes ready
        emit(navigationActions.setPendingNavigation({ screen: ScreenNames.ChannelScreen }))
      }),
      nativeEventEmitter?.addListener(NativeEventKeys.Stop, () => {
        emit(app.actions.stopBackend())
      }),
      nativeEventEmitter?.addListener(NativeEventKeys.AppPause, (event?: AppPauseEvent) => {
        const transitionId = event?.transitionId
        if (transitionId && handledPauseTransitions.has(transitionId)) return
        if (transitionId) {
          handledPauseTransitions.add(transitionId)
          handledPauseTransitionOrder.push(transitionId)
          if (handledPauseTransitionOrder.length > 64) {
            handledPauseTransitions.delete(handledPauseTransitionOrder.shift() as string)
          }
        }

        emit(nativeServicesActions.flushPersistor(transitionId ? { transitionId } : {}))
        if (event?.isBackground !== false) {
          emit(network.actions.removeInitializedCommunities())
        }
      }),
      nativeEventEmitter?.addListener(NativeEventKeys.AppResume, () => {
        emit(initActions.resumeWebsocketConnection())
      }),
    ]
    return () => {
      subscriptions.forEach(subscription => subscription?.remove())
    }
  }, buffers.expanding())
}
