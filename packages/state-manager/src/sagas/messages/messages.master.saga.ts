import { takeEvery } from 'redux-saga/effects'
import { all } from 'typed-redux-saga'
import { type Socket } from '../../types'
import { messagesActions } from './messages.slice'
import { sendMessageSaga } from './sendMessage/sendMessage.saga'
import { incomingMessagesSaga } from './incomingMessages/incomingMessages.saga'
import { verifyMessagesSaga } from './verifyMessage/verifyMessages.saga'
import { askForMessagesSaga } from './askForMessages/askForMessages.saga'
import { checkForMessagesSaga } from './checkForMessages/checkForMessages.saga'
import { markUnreadChannelsSaga } from '../publicChannels/markUnreadChannels/markUnreadChannels.saga'
import { updateNewestMessageSaga } from '../publicChannels/updateNewestMessage/updateNewestMessage.saga'
import { lazyLoadingSaga } from './lazyLoading/lazyLoading.saga'
import { resetCurrentPublicChannelCacheSaga } from './manageCache/resetChannelCache.saga'
import { extendCurrentPublicChannelCacheSaga } from './manageCache/extendChannelCache.saga'
import { autoDownloadFilesSaga } from '../files/autoDownloadFiles/autoDownloadFiles.saga'
import { sendDeletionMessageSaga } from './sendDeletionMessage/sendDeletionMessage.saga'

export function* messagesMasterSaga(socket: Socket): Generator {
  yield all([
    takeEvery(messagesActions.sendMessage.type, sendMessageSaga, socket),
    takeEvery(messagesActions.incomingMessages.type, autoDownloadFilesSaga, socket),
    takeEvery(messagesActions.incomingMessages.type, incomingMessagesSaga),
    takeEvery(messagesActions.incomingMessages.type, verifyMessagesSaga),
    takeEvery(messagesActions.incomingMessages.type, markUnreadChannelsSaga),
    takeEvery(messagesActions.incomingMessages.type, updateNewestMessageSaga),
    takeEvery(messagesActions.lazyLoading.type, lazyLoadingSaga),
    takeEvery(messagesActions.extendCurrentPublicChannelCache.type, extendCurrentPublicChannelCacheSaga),
    takeEvery(messagesActions.resetCurrentPublicChannelCache.type, resetCurrentPublicChannelCacheSaga),
    takeEvery(messagesActions.responseSendMessagesIds.type, checkForMessagesSaga),
    takeEvery(messagesActions.askForMessages.type, askForMessagesSaga, socket),
    takeEvery(messagesActions.sendDeletionMessage.type, sendDeletionMessageSaga),
  ])
}
