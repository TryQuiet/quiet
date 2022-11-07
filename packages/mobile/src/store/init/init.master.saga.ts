import { all, takeLeading } from 'typed-redux-saga'
import { initActions } from './init.slice'
import { startConnectionSaga } from './startConnection/startConnection.saga'
import { onConnectedSaga } from './onConnected/onConnected.saga'

export function* initMasterSaga(): Generator {
  yield all([
    takeLeading(initActions.startWebsocketConnection.type, startConnectionSaga),
    takeLeading(initActions.setWebsocketConnected.type, onConnectedSaga)
  ])
}
