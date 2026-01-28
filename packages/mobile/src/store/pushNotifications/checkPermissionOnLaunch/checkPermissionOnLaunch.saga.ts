import { Platform, NativeModules } from 'react-native'
import { call, select } from 'typed-redux-saga'
import { pushNotificationsSelectors } from '../pushNotifications.selectors'
import { createLogger } from '../../../utils/logger'

const logger = createLogger('checkPermissionOnLaunchSaga')

export function* checkPermissionOnLaunchSaga(): Generator {
  if (Platform.OS !== 'ios') return

  const wasRequested = yield* select(pushNotificationsSelectors.permissionRequested)
  if (!wasRequested) {
    logger.info('Permission never requested, skipping launch check')
    return
  }

  logger.info('Checking notification permission on app launch')
  yield* call(NativeModules.CommunicationModule.checkNotificationPermission)
}
