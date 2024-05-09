import { type Socket } from '../../types'
import { all, takeEvery, cancelled } from 'typed-redux-saga'
import { checkForMissingFilesSaga } from './checkForMissingFiles/checkForMissingFiles.saga'
import { resetTransferSpeedSaga } from './resetTransferSpeed/resetTransferSpeed.saga'
import { updateMessageMediaSaga } from './updateMessageMedia/updateMessageMedia'
import { filesActions } from './files.slice'
import { cancelDownloadSaga } from './cancelDownload/cancelDownload.saga'
import { broadcastHostedFileSaga } from './broadcastHostedFile/broadcastHostedFile.saga'
import { downloadFileSaga } from './downloadFile/downloadFileSaga'
import { networkActions } from '../network/network.slice'
import { deleteFilesFromChannelSaga } from './deleteFilesFromChannel/deleteFilesFromChannel.saga'
import { uploadFileSaga } from './sendFileMessage/uploadFile.saga'
import { messagesActions } from '../messages/messages.slice'
import { sendFileMessageSaga } from './uploadFile/sendFileMessage.saga'

export function* filesMasterSaga(socket: Socket): Generator {
  console.log('filesMasterSaga starting')
  try {
    yield all([
      takeEvery(networkActions.addInitializedCommunity.type, resetTransferSpeedSaga),
      takeEvery(filesActions.checkForMissingFiles.type, checkForMissingFilesSaga, socket),
      takeEvery(filesActions.uploadFile.type, sendFileMessageSaga),
      takeEvery(messagesActions.addMessagesSendingStatus.type, uploadFileSaga, socket),
      takeEvery(filesActions.cancelDownload.type, cancelDownloadSaga, socket),
      takeEvery(filesActions.updateMessageMedia.type, updateMessageMediaSaga),
      takeEvery(filesActions.downloadFile.type, downloadFileSaga, socket),
      takeEvery(filesActions.broadcastHostedFile.type, broadcastHostedFileSaga, socket),
      takeEvery(filesActions.deleteFilesFromChannel.type, deleteFilesFromChannelSaga, socket),
    ])
  } finally {
    console.log('filesMasterSaga stopping')
    if (yield cancelled()) {
      console.log('filesMasterSaga cancelled')
    }
  }
}
