import { communities } from '@quiet/state-manager'
import { all, takeEvery } from 'redux-saga/effects'
import { customProtocolSaga } from './invitation/customProtocol.saga'
import { startConnectionSaga } from './socket/socket.saga'
import { socketActions } from './socket/socket.slice'

export default function* root(): Generator {
  yield all([
    takeEvery(communities.actions.customProtocol.type, customProtocolSaga),
    takeEvery(socketActions.startConnection.type, startConnectionSaga),
  ])
}
