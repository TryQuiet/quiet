import { all, fork, takeLeading } from 'typed-redux-saga'
import { initActions } from './init.slice'
import { watchWebsocketConnection } from './startConnection/startConnection.saga'
import { deepLinkSaga } from './deepLink/deepLink.saga'

export function* initMasterSaga(): Generator {
  yield all([fork(watchWebsocketConnection), takeLeading(initActions.deepLink.type, deepLinkSaga)])
}
