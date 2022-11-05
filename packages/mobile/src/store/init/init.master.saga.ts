import { all, takeLeading } from 'typed-redux-saga'
import { initActions } from './init.slice'
import { startConnectionSaga } from './startConnection/startConnection.saga'

export function* initMasterSaga(): Generator {
  yield all([
    takeLeading(initActions.startWebsocketConnection.type, startConnectionSaga)
  ])
}
