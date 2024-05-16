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
import { createLogger } from '../../utils/logger'

const logger = createLogger('filesMasterSaga')

export function* filesMasterSaga(socket: Socket): Generator {
  logger.info('filesMasterSaga starting')
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
    logger.info('filesMasterSaga stopping')
    if (yield cancelled()) {
      logger.info('filesMasterSaga cancelled')
    }
  }
}
