import { Platform } from 'react-native'
import { put, select } from 'typed-redux-saga'
import { pushNotificationsActions } from '../pushNotifications.slice'
import { pushNotificationsSelectors } from '../pushNotifications.selectors'
import { createLogger } from '../../../utils/logger'

const logger = createLogger('triggerPermissionRequestSaga')

export function* triggerPermissionRequestSaga(): Generator {
  if (Platform.OS !== 'ios') return

  const alreadyRequested = yield* select(pushNotificationsSelectors.permissionRequested)

  logger.info(`App opened. alreadyRequested=${alreadyRequested}`)

  if (!alreadyRequested) {
    logger.info('Requesting notification permission')
    yield* put(pushNotificationsActions.requestPermission())
  } else {
    logger.info('Permission already requested, checking current status')
    yield* put(pushNotificationsActions.checkPermissionOnLaunch())
  }
}
