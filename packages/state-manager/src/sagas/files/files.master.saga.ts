import { Socket } from 'socket.io-client'
import { all, takeEvery } from 'typed-redux-saga'
import { connectionActions } from '../appConnection/connection.slice'
import { checkForMissingFilesSaga } from './checkForMissingFiles/checkForMissingFiles.saga'
import { updateMessageMediaSaga } from './updateMessageMedia/updateMessageMedia'
import { filesActions } from './files.slice'
import { uploadFileSaga } from './uploadFile/uploadFile.saga'
import { cancelDownloadSaga } from './cancelDownload/cancelDownload.saga'
import { broadcastHostedFileSaga } from './broadcastHostedFile/broadcastHostedFile.saga'
import { downloadFileSaga } from './downloadFile/downloadFileSaga'

export function* filesMasterSaga(socket: Socket): Generator {
  yield all([
    takeEvery(
      connectionActions.addInitializedCommunity.type,
      checkForMissingFilesSaga,
      socket
    ),
    takeEvery(
      filesActions.uploadFile.type,
      uploadFileSaga,
      socket
    ),
    takeEvery(
      filesActions.cancelDownload.type,
      cancelDownloadSaga,
      socket
    ),
    takeEvery(
      filesActions.updateMessageMedia.type,
      updateMessageMediaSaga
    ),
    takeEvery(
      filesActions.downloadFile.type,
      downloadFileSaga,
      socket
    ),
    takeEvery(
      filesActions.broadcastHostedFile.type,
      broadcastHostedFileSaga,
      socket
    )
  ])
}
