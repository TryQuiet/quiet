import { takeEvery } from 'typed-redux-saga'
import { Socket } from '../../types'
import { pushNotificationsActions } from './pushNotifications.slice'
import { sendDeviceTokenSaga } from './sendDeviceToken.saga'

export function* pushNotificationsMasterSaga(socket: Socket): Generator {
  yield* takeEvery(pushNotificationsActions.sendDeviceTokenToBackend.type, sendDeviceTokenSaga, socket)
}
