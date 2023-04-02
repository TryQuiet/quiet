import { all, takeLeading } from 'typed-redux-saga'
import { initActions } from './init.slice'
import { startConnectionSaga } from './startConnection/startConnection.saga'
import { onConnectedSaga } from './onConnected/onConnected.saga'
import { deepLinkSaga } from './deepLink/deepLink.saga'

export function* initMasterSaga(): Generator {
  yield all([
    takeLeading(initActions.startWebsocketConnection.type, startConnectionSaga),
    takeLeading(initActions.setWebsocketConnected.type, onConnectedSaga),
    takeLeading(initActions.deepLink.type, deepLinkSaga)
  ])
}
