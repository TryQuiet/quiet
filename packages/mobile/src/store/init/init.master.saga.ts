import { all, fork, takeLeading } from 'typed-redux-saga'
import { initActions } from './init.slice'
import { resumeWebsocketConnectionSaga, watchWebsocketConnection } from './startConnection/startConnection.saga'
import { deepLinkSaga } from './deepLink/deepLink.saga'

export function* initMasterSaga(): Generator {
  yield all([
    fork(watchWebsocketConnection),
    takeLeading(initActions.resumeWebsocketConnection.type, resumeWebsocketConnectionSaga),
    takeLeading(initActions.deepLink.type, deepLinkSaga),
  ])
}
