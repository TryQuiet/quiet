import { all, takeEvery, cancelled } from 'typed-redux-saga'
import { type Socket } from '../../types'
import { messagesActions } from './messages.slice'
import { sendMessageSaga } from './sendMessage/sendMessage.saga'
import { addMessagesSaga } from './addMessages/addMessages.saga'
import { checkForMessagesSaga } from './checkForMessages/checkForMessages.saga'
import { verifyMessagesSaga } from './verifyMessage/verifyMessages.saga'
import { getMessagesSaga } from './getMessages/getMessages.saga'
import { markUnreadChannelsSaga } from '../publicChannels/markUnreadChannels/markUnreadChannels.saga'
import { updateNewestMessageSaga } from '../publicChannels/updateNewestMessage/updateNewestMessage.saga'
import { lazyLoadingSaga } from './lazyLoading/lazyLoading.saga'
import { resetCurrentPublicChannelCacheSaga } from './manageCache/resetChannelCache.saga'
import { extendCurrentPublicChannelCacheSaga } from './manageCache/extendChannelCache.saga'
import { autoDownloadFilesSaga } from '../files/autoDownloadFiles/autoDownloadFiles.saga'
import { sendDeletionMessageSaga } from './sendDeletionMessage/sendDeletionMessage.saga'
import { createLogger } from '../../utils/logger'

const logger = createLogger('messagesMasterSaga')

export function* messagesMasterSaga(socket: Socket): Generator {
  logger.info('messagesMasterSaga starting')
  try {
    yield all([
      takeEvery(messagesActions.sendMessage.type, sendMessageSaga, socket),
      takeEvery(messagesActions.addMessages.type, autoDownloadFilesSaga, socket),
      takeEvery(messagesActions.addMessages.type, addMessagesSaga),
      takeEvery(messagesActions.addMessages.type, verifyMessagesSaga),
      takeEvery(messagesActions.addMessages.type, markUnreadChannelsSaga),
      takeEvery(messagesActions.addMessages.type, updateNewestMessageSaga),
      takeEvery(messagesActions.lazyLoading.type, lazyLoadingSaga),
      takeEvery(messagesActions.extendCurrentPublicChannelCache.type, extendCurrentPublicChannelCacheSaga),
      takeEvery(messagesActions.resetCurrentPublicChannelCache.type, resetCurrentPublicChannelCacheSaga),
      takeEvery(messagesActions.checkForMessages.type, checkForMessagesSaga),
      takeEvery(messagesActions.getMessages.type, getMessagesSaga, socket),
      takeEvery(messagesActions.sendDeletionMessage.type, sendDeletionMessageSaga),
    ])
  } finally {
    logger.info('messagesMasterSaga stopping')
    if (yield cancelled()) {
      logger.info('messagesMasterSaga cancelled')
    }
  }
}
