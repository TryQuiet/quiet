import { all } from 'redux-saga/effects'
import { startConnectionSaga } from './socket/socket.saga'
import { socketActions } from './socket/socket.slice'

export default function* root(): Generator {
  yield all([
    startConnectionSaga(
      socketActions.startConnection({
        dataPort: parseInt(new URLSearchParams(window.location.search).get('dataPort'))
      })
    )
  ])
}
