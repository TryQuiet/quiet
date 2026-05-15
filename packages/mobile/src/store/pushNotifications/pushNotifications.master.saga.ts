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
import { communities, pushNotifications } from '@quiet/state-manager'
import { initSelectors } from '../init/init.selectors'
import { createLogger } from '../../utils/logger'
import Config from 'react-native-config'

const logger = createLogger('pushNotificationsMasterSaga')

// Event keys matching CommunicationModule.swift
const NOTIFICATION_PERMISSION_RESULT = 'notificationPermissionResult'
const DEVICE_TOKEN_RECEIVED = 'deviceTokenReceived'

const firebaseMessagingModule = NativeModules.FirebaseMessagingModule

function* requestPermissionSaga(): Generator {
  logger.info('Requesting iOS notification permission')
  yield* call(NativeModules.CommunicationModule.requestNotificationPermission)
}

function* checkPermissionSaga(): Generator {
  logger.info('Checking notification permission')
  yield* call(NativeModules.CommunicationModule.checkNotificationPermission)
}

function* triggerPermissionRequestSaga(): Generator {
  if (Config.QPS_ALLOWED !== 'true') {
    logger.info('QPS not allowed, skipping automatic permission request trigger')
    return
  }
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
  while (true) {
    const connected = yield* select(initSelectors.isWebsocketConnected)
    if (connected) break
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

function* syncCurrentDeviceTokenSaga(): Generator {
  if (Config.QPS_ALLOWED !== 'true') {
    logger.info('QPS not allowed, skipping device token sync')
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
    logger.info('Failed to fetch current FCM token')
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
      yield* call(sendDeviceTokenToBackendSaga, token)
    }
  } finally {
    if (yield cancelled()) {
      channel.close()
    }
  }
}

export function* pushNotificationsMasterSaga(): Generator {
  if (Platform.OS !== 'ios' || Config.QPS_ALLOWED !== 'true') {
    logger.info(`Skipping push notifications saga (platform=${Platform.OS}, QPS_ALLOWED=${Config.QPS_ALLOWED})`)
    return
  }

  logger.info('pushNotificationsMasterSaga starting')
  try {
    // Set up native event listeners before triggering any permission requests
    yield* fork(watchPermissionResults)
    yield* fork(watchDeviceToken)
    yield* fork(watchAppState)

    yield* all([
      takeEvery(pushNotificationsActions.requestPermission.type, requestPermissionSaga),
      takeEvery(pushNotificationsActions.checkPermissionOnLaunch.type, checkPermissionSaga),
      takeEvery(communities.actions.setCurrentCommunity.type, syncCurrentDeviceTokenSaga),
      fork(triggerPermissionRequestSaga),
    ])
  } finally {
    logger.info('pushNotificationsMasterSaga stopping')
    if (yield cancelled()) {
      logger.info('pushNotificationsMasterSaga cancelled')
    }
  }
}
