import { all, fork, takeEvery, call, put, select, take, cancelled, delay } from 'typed-redux-saga'
import { eventChannel } from 'redux-saga'
import { NativeModules, AppState, AppStateStatus, Platform } from 'react-native'
import DeviceInfo from 'react-native-device-info'
import nativeEventEmitter from '../nativeServices/events/nativeEventEmitter'
import { pushNotificationsActions } from './pushNotifications.slice'
import { pushNotificationsSelectors } from './pushNotifications.selectors'
import {
  handlePermissionResultSaga,
  PermissionResultPayload,
} from './handlePermissionResult/handlePermissionResult.saga'
import { NotificationPermissionStatus } from './pushNotifications.types'
import { pushNotifications } from '@quiet/state-manager'
import { initSelectors } from '../init/init.selectors'
import { createLogger } from '../../utils/logger'

const logger = createLogger('pushNotificationsMasterSaga')

// Event keys matching CommunicationModule on iOS and Android.
const NOTIFICATION_PERMISSION_RESULT = 'notificationPermissionResult'
const DEVICE_TOKEN_RECEIVED = 'deviceTokenReceived'

const communicationModule = NativeModules.CommunicationModule
const firebaseMessagingModule = NativeModules.FirebaseMessagingModule

function* requestPermissionSaga(): Generator {
  if (!communicationModule?.requestNotificationPermission) {
    logger.warn('CommunicationModule.requestNotificationPermission is unavailable')
    return
  }
  logger.info(`Requesting ${Platform.OS} notification permission`)
  yield* call([communicationModule, communicationModule.requestNotificationPermission])
}

function* checkPermissionSaga(): Generator {
  if (!communicationModule?.checkNotificationPermission) {
    logger.warn('CommunicationModule.checkNotificationPermission is unavailable')
    return
  }
  logger.info(`Checking ${Platform.OS} notification permission`)
  yield* call([communicationModule, communicationModule.checkNotificationPermission])
}

function* triggerPermissionRequestSaga(): Generator {
  const alreadyRequested = yield* select(pushNotificationsSelectors.permissionRequested)
  logger.info(`App opened. alreadyRequested=${alreadyRequested}`)

  if (!alreadyRequested) {
    yield* put(pushNotificationsActions.requestPermission())
  } else {
    yield* put(pushNotificationsActions.checkPermissionOnLaunch())
  }
}

function createPermissionResultChannel() {
  return eventChannel<PermissionResultPayload>(emit => {
    const subscription = nativeEventEmitter?.addListener(NOTIFICATION_PERMISSION_RESULT, (data: any) => emit(data))
    return () => subscription?.remove()
  })
}

function createDeviceTokenChannel() {
  return eventChannel<{ token: string }>(emit => {
    const subscription = nativeEventEmitter?.addListener(DEVICE_TOKEN_RECEIVED, (data: any) => emit(data))
    return () => subscription?.remove()
  })
}

function hasGrantedPermission(payload: PermissionResultPayload): boolean {
  if (payload.status) {
    return payload.status === NotificationPermissionStatus.Granted
  }

  return payload.granted === true
}

function* waitForWebsocketConnectionSaga(): Generator {
  let waitingForConnection = false

  while (true) {
    const connected = yield* select(initSelectors.isWebsocketConnected)
    if (connected) {
      if (waitingForConnection) {
        logger.info('Websocket connected, resuming device token send')
      }
      break
    }
    if (!waitingForConnection) {
      waitingForConnection = true
      logger.info('Websocket not connected yet, delaying device token send')
    }
    yield* delay(500)
  }
}

function* sendDeviceTokenToBackendSaga(token: string): Generator {
  logger.info('Waiting for websocket connection before sending FCM token')
  yield* call(waitForWebsocketConnectionSaga)
  logger.info('Sending FCM token to backend')
  const platform = Platform.OS === 'android' ? 'android' : 'ios'
  const bundleId = DeviceInfo.getBundleId()
  yield* put(
    pushNotifications.actions.sendDeviceTokenToBackend({
      deviceToken: token,
      bundleId,
      platform,
    })
  )
}

function* hasGrantedNotificationPermissionSaga(): Generator<any, boolean, any> {
  const permissionStatus = yield* select(pushNotificationsSelectors.permissionStatus)
  return permissionStatus === NotificationPermissionStatus.Granted
}

function* syncCurrentDeviceTokenSaga(): Generator {
  const hasGrantedPermission = yield* call(hasGrantedNotificationPermissionSaga)
  if (!hasGrantedPermission) {
    logger.info('Skipping current FCM token sync because notification permission is not granted')
    return
  }

  if (!firebaseMessagingModule?.getToken) {
    logger.warn('FirebaseMessagingModule.getToken is unavailable, skipping initial token sync')
    return
  }

  try {
    const token = (yield* call([firebaseMessagingModule, firebaseMessagingModule.getToken])) as string | null

    if (!token) {
      logger.info('No current FCM token available yet')
      return
    }

    logger.info('Fetched current FCM token from native module')
    yield* call(sendDeviceTokenToBackendSaga, token)
  } catch (error) {
    logger.error('Failed to fetch current FCM token', error)
  }
}

function* watchPermissionResults(): Generator {
  const channel = yield* call(createPermissionResultChannel)
  try {
    while (true) {
      const payload = yield* take(channel)
      yield* call(handlePermissionResultSaga, payload)
      if (hasGrantedPermission(payload)) {
        yield* call(syncCurrentDeviceTokenSaga)
      }
    }
  } finally {
    if (yield cancelled()) {
      channel.close()
    }
  }
}

function createAppStateChannel() {
  return eventChannel<AppStateStatus>(emit => {
    const subscription = AppState.addEventListener('change', (state: AppStateStatus) => emit(state))
    return () => subscription.remove()
  })
}

function* watchAppState(): Generator {
  const channel = yield* call(createAppStateChannel)
  try {
    while (true) {
      const state = yield* take(channel)
      if (state === 'active') {
        logger.info('App became active, re-checking notification permission')
        yield* put(pushNotificationsActions.checkPermissionOnLaunch())
      }
    }
  } finally {
    if (yield cancelled()) {
      channel.close()
    }
  }
}

function* watchDeviceToken(): Generator {
  const channel = yield* call(createDeviceTokenChannel)
  try {
    while (true) {
      const { token } = yield* take(channel)
      const hasGrantedPermission = yield* call(hasGrantedNotificationPermissionSaga)
      if (!hasGrantedPermission) {
        logger.info('Skipping live FCM token forward because notification permission is not granted')
        continue
      }

      logger.info('Forwarding live FCM token update from native event channel')
      yield* call(sendDeviceTokenToBackendSaga, token)
    }
  } finally {
    if (yield cancelled()) {
      channel.close()
    }
  }
}

export function* pushNotificationsMasterSaga(): Generator {
  logger.info('pushNotificationsMasterSaga starting')
  try {
    yield* fork(watchDeviceToken)
    yield* fork(watchPermissionResults)
    yield* fork(watchAppState)

    yield* all([
      takeEvery(pushNotificationsActions.requestPermission.type, requestPermissionSaga),
      takeEvery(pushNotificationsActions.checkPermissionOnLaunch.type, checkPermissionSaga),
      fork(triggerPermissionRequestSaga),
    ])
  } finally {
    logger.info('pushNotificationsMasterSaga stopping')
    if (yield cancelled()) {
      logger.info('pushNotificationsMasterSaga cancelled')
    }
  }
}
