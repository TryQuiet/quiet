import { all, takeEvery } from 'redux-saga/effects'
import { startConnectionSaga } from './socket/socket.saga'
import { socketActions } from './socket/socket.slice'

export default function* root(): Generator {
  yield all([
    takeEvery(socketActions.startConnection.type, startConnectionSaga)
  ])
}
