import { put } from 'typed-redux-saga'
import { pushNotificationsActions } from '../pushNotifications.slice'
import { NotificationPermissionStatus } from '../pushNotifications.types'
import { createLogger } from '../../../utils/logger'

const logger = createLogger('handlePermissionResultSaga')

export interface PermissionResultPayload {
  granted?: boolean
  status?: string
  error?: string
}

export function* handlePermissionResultSaga(payload: PermissionResultPayload): Generator {
  logger.info('Received permission result', JSON.stringify(payload))

  let status: NotificationPermissionStatus

  if (payload.status) {
    // From checkNotificationPermission
    status = payload.status as NotificationPermissionStatus
  } else if (payload.granted !== undefined) {
    // From requestAuthorization callback
    status = payload.granted ? NotificationPermissionStatus.Granted : NotificationPermissionStatus.Denied
  } else {
    logger.error('Unknown permission result format', payload)
    return
  }

  yield* put(pushNotificationsActions.setPermissionStatus(status))
}
