import { all, takeEvery, takeLeading } from 'typed-redux-saga'
import { initActions } from './init.slice'
import { onRestoreSaga } from './onRestore/onRestore.saga'
import { startConnectionSaga } from './startConnection/startConnection.saga'

export function* initMasterSaga(): Generator {
  yield all([
    takeEvery(initActions.onRestore.type, onRestoreSaga),
    takeLeading(initActions.startWebsocketConnection.type, startConnectionSaga)
  ])
}
