import { all, fork, takeEvery } from 'typed-redux-saga'
import { initSaga } from '../app/init.saga'
import { connectionActions } from './connection.slice'
import { uptimeSaga } from './uptime/uptime.saga'

export function* connectionMasterSaga(): Generator {
  yield all([
    fork(
      uptimeSaga,
    ),
    takeEvery(
      connectionActions.startInitSaga.type,
      initSaga,
    )
  ])
}
