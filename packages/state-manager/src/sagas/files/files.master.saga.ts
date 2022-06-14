import { Socket } from 'socket.io-client'
import { all, takeEvery } from 'typed-redux-saga'
import { connectionActions } from '../appConnection/connection.slice'
import { checkForMissingFilesSaga } from './checkForMissingFiles/checkForMissingFiles.saga'

export function* filesMasterSaga(socket: Socket): Generator {
  yield all([
    takeEvery(
      connectionActions.addInitializedCommunity.type,
      checkForMissingFilesSaga,
      socket
    )
  ])
}
