import { all, fork, takeEvery, takeLatest } from 'typed-redux-saga'
import { uptimeSaga } from './uptime/uptime.saga'
import { increaseLoadingProcess } from './increaseLoadingProcess/increaseLoadingProcess.saga'
import { connectionActions } from './connection.slice'

export function* connectionMasterSaga(): Generator {
  yield all([fork(uptimeSaga), takeLatest(connectionActions.increaseLoadingProcess.type, increaseLoadingProcess)])
}
