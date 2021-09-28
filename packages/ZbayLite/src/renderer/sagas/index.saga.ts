import { all, fork } from 'redux-saga/effects'
import { socketSaga } from './socket/socket.saga'

export default function* root(): Generator {
  yield all([
    fork(socketSaga)
  ])
}
