import { Socket } from 'socket.io-client'
import { all, fork } from 'typed-redux-saga'
import { checkForMissingFilesSaga } from './checkForMissingFiles/checkForMissingFiles.saga'

export function* filesMasterSaga(socket: Socket): Generator {
  yield all([fork(checkForMissingFilesSaga, socket)])
}
