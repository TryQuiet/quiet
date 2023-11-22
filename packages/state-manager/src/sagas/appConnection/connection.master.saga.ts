import { all, fork } from 'typed-redux-saga'
import { uptimeSaga } from './uptime/uptime.saga'

export function* connectionMasterSaga(): Generator {
    yield all([fork(uptimeSaga)])
}
