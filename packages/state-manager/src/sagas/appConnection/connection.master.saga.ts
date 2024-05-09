import { all, fork, cancelled } from 'typed-redux-saga'
import { uptimeSaga } from './uptime/uptime.saga'

export function* connectionMasterSaga(): Generator {
  console.log('connectionMasterSaga starting')
  try {
    yield all([fork(uptimeSaga)])
  } finally {
    console.log('connectionMasterSaga stopping')
    if (yield cancelled()) {
      console.log('connectionMasterSaga cancelled')
    }
  }
}
