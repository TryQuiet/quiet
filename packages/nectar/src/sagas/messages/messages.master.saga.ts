import { takeEvery } from 'redux-saga/effects'
import { all } from 'typed-redux-saga'
import { Socket } from 'socket.io-client'
import { messagesActions } from './messages.slice'
import { sendMessageSaga } from './sendMessage/sendMessage.saga'
import { incomingMessagesSaga } from './incomingMessages/incomingMessages.saga'
import { publicChannelsActions } from '../publicChannels/publicChannels.slice'
import { verifyMessagesSaga } from './verifyMessage/verifyMessages.saga'
import { askForMessagesSaga } from './askForMessages/askForMessages.saga'
import { checkForMessagesSaga } from './checkForMessages/checkForMessages.saga'
import { markUnreadChannelsSaga } from '../publicChannels/markUnreadChannels/markUnreadChannels.saga'
import { updateMessagesSendingStatusSaga } from './updateMessagesSendingStatus/updateMessagesSendingStatus.saga'
import { lazyLoadingSaga } from './lazyLoading/lazyLoading.saga'

export function* messagesMasterSaga(socket: Socket): Generator {
  yield all([
    takeEvery(messagesActions.sendMessage.type, sendMessageSaga, socket),
    takeEvery(messagesActions.incomingMessages.type, incomingMessagesSaga),
    takeEvery(messagesActions.incomingMessages.type, verifyMessagesSaga),
    takeEvery(messagesActions.incomingMessages.type, markUnreadChannelsSaga),
    takeEvery(publicChannelsActions.cacheMessages.type, updateMessagesSendingStatusSaga),
    takeEvery(messagesActions.lazyLoading.type, lazyLoadingSaga),
    takeEvery(
      messagesActions.responseSendMessagesIds.type,
      checkForMessagesSaga
    ),
    takeEvery(
      messagesActions.askForMessages.type,
      askForMessagesSaga,
      socket
    ),
  ])
}
