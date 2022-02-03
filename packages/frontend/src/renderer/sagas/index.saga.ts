import { publicChannels } from '@quiet/nectar'
import { all, takeEvery } from 'redux-saga/effects'
import { displayMessageNotificationSaga } from '../notifications'
import { startConnectionSaga } from './socket/socket.saga'
import { socketActions } from './socket/socket.slice'

export default function* root(): Generator {
  yield all([
    takeEvery(socketActions.startConnection.type, startConnectionSaga),
    takeEvery(publicChannels.actions.incomingMessages.type, displayMessageNotificationSaga)
  ])
}
