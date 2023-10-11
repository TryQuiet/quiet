import { communities } from '@quiet/state-manager'
import { all, takeEvery } from 'redux-saga/effects'
import { handleInvitationCodeSaga } from './invitation/handleInvitationCode.saga'
import { startConnectionSaga } from './socket/socket.saga'
import { socketActions } from './socket/socket.slice'

export default function* root(): Generator {
  const dataPort = new URLSearchParams(window.location.search).get('dataPort') || ''
  const socketIOSecret = new URLSearchParams(window.location.search).get('socketIOSecret') || ''
  yield all([
    takeEvery(communities.actions.handleInvitationCode.type, handleInvitationCodeSaga),
    startConnectionSaga(
      socketActions.startConnection({
        dataPort: parseInt(dataPort),
        socketIOSecret,
      })
    ),
  ])
}
