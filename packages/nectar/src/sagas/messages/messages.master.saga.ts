import { takeEvery } from 'redux-saga/effects'
import { all } from 'typed-redux-saga'
import { Socket } from 'socket.io-client'
import { messagesActions } from './messages.slice'
import { sendMessageSaga } from './sendMessage/sendMessage.saga'
import { incomingMessagesSaga } from './incomingMessages/incomingMessages.saga'
import { verifyMessagesSaga } from './verifyMessage/verifyMessages.saga'
import { askForMessagesSaga } from './askForMessages/askForMessages.saga'
import { checkForMessagesSaga } from './checkForMessages/checkForMessages.saga'
import { markUnreadChannelsSaga } from '../publicChannels/markUnreadChannels/markUnreadChannels.saga'
import { lazyLoadingSaga } from './lazyLoading/lazyLoading.saga'
import { resetCurrentPublicChannelCacheSaga } from './manageCache/resetChannelCache.saga'
import { extendCurrentPublicChannelCacheSaga } from './manageCache/extendChannelCache.saga'
import { checkIsImageSaga } from './checkIsImage/checkIsImage.saga'
import { uploadFileSaga } from './uploadFile/uploadFile.saga'

export function* messagesMasterSaga(socket: Socket): Generator {
  yield all([
    takeEvery(messagesActions.sendMessage.type, sendMessageSaga, socket),
    takeEvery(messagesActions.incomingMessages.type, checkIsImageSaga, socket),
    takeEvery(messagesActions.uploadFile.type, uploadFileSaga, socket),
    takeEvery(messagesActions.incomingMessages.type, incomingMessagesSaga),
    takeEvery(messagesActions.incomingMessages.type, verifyMessagesSaga),
    takeEvery(messagesActions.incomingMessages.type, markUnreadChannelsSaga),
    takeEvery(messagesActions.lazyLoading.type, lazyLoadingSaga),
    takeEvery(messagesActions.extendCurrentPublicChannelCache.type, extendCurrentPublicChannelCacheSaga),
    takeEvery(messagesActions.resetCurrentPublicChannelCache.type, resetCurrentPublicChannelCacheSaga),
    takeEvery(
      messagesActions.responseSendMessagesIds.type,
      checkForMessagesSaga
    ),
    takeEvery(
      messagesActions.askForMessages.type,
      askForMessagesSaga,
      socket
    )
  ])
}
