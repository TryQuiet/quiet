import { messages } from '@quiet/state-manager'
import { all, takeEvery } from 'redux-saga/effects'
import { displayMessageNotificationSaga } from './notifications/notifications'
import { startConnectionSaga } from './socket/socket.saga'
import { socketActions } from './socket/socket.slice'

export default function* root(): Generator {
  yield* startConnectionSaga(
    socketActions.startConnection({
      dataPort: parseInt(new URLSearchParams(window.location.search).get('dataPort'))
    })
  )
  yield all([
    takeEvery(messages.actions.incomingMessages.type, displayMessageNotificationSaga)
  ])
}
