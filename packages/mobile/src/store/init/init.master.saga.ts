import { all, takeLatest, takeLeading } from 'typed-redux-saga'
import { initActions } from './init.slice'
import { startConnectionSaga } from './startConnection/startConnection.saga'
import { deepLinkSaga } from './deepLink/deepLink.saga'

export function* initMasterSaga(): Generator {
  yield all([
    takeLatest(initActions.startWebsocketConnection.type, startConnectionSaga),
    takeLeading(initActions.deepLink.type, deepLinkSaga),
  ])
}
