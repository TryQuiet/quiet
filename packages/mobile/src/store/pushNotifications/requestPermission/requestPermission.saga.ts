import { Platform, NativeModules } from 'react-native'
import { call, select } from 'typed-redux-saga'
import { pushNotificationsSelectors } from '../pushNotifications.selectors'
import { createLogger } from '../../../utils/logger'

const logger = createLogger('requestPermissionSaga')

export function* requestPermissionSaga(): Generator {
  if (Platform.OS !== 'ios') {
    logger.info('Skipping iOS notification permission on non-iOS platform')
    return
  }

  const alreadyRequested = yield* select(pushNotificationsSelectors.permissionRequested)
  if (alreadyRequested) {
    logger.info('Permission already requested, checking current status')
    yield* call(NativeModules.CommunicationModule.checkNotificationPermission)
    return
  }

  logger.info('Requesting iOS notification permission')
  yield* call(NativeModules.CommunicationModule.requestNotificationPermission)
}
