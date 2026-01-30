import { all, fork, takeEvery, call, put, select, take, cancelled } from 'typed-redux-saga'
import { eventChannel } from 'redux-saga'
import { NativeModules, AppState, AppStateStatus, Platform } from 'react-native'
import nativeEventEmitter from '../nativeServices/events/nativeEventEmitter'
import { pushNotificationsActions } from './pushNotifications.slice'
import { pushNotificationsSelectors } from './pushNotifications.selectors'
import {
  handlePermissionResultSaga,
  PermissionResultPayload,
} from './handlePermissionResult/handlePermissionResult.saga'
import { pushNotifications } from '@quiet/state-manager'
import { createLogger } from '../../utils/logger'

const logger = createLogger('pushNotificationsMasterSaga')

// Event keys matching CommunicationModule.swift
const NOTIFICATION_PERMISSION_RESULT = 'notificationPermissionResult'
const DEVICE_TOKEN_RECEIVED = 'deviceTokenReceived'

function* requestPermissionSaga(): Generator {
  logger.info('Requesting iOS notification permission')
  yield* call(NativeModules.CommunicationModule.requestNotificationPermission)
}

function* checkPermissionSaga(): Generator {
  logger.info('Checking notification permission')
  yield* call(NativeModules.CommunicationModule.checkNotificationPermission)
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

function* watchPermissionResults(): Generator {
  const channel = yield* call(createPermissionResultChannel)
  try {
    while (true) {
      const payload = yield* take(channel)
      yield* call(handlePermissionResultSaga, payload)
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
      logger.info('Received device token')
      yield* put(pushNotificationsActions.setDeviceToken(token))
      yield* put(pushNotifications.actions.sendDeviceTokenToBackend(token))
    }
  } finally {
    if (yield cancelled()) {
      channel.close()
    }
  }
}

export function* pushNotificationsMasterSaga(): Generator {
  if (Platform.OS !== 'ios') {
    logger.info('Skipping push notifications saga on non-iOS')
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
      fork(triggerPermissionRequestSaga),
    ])
  } finally {
    logger.info('pushNotificationsMasterSaga stopping')
    if (yield cancelled()) {
      logger.info('pushNotificationsMasterSaga cancelled')
    }
  }
}
