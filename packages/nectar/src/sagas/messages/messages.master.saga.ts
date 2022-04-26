import { takeEvery } from 'redux-saga/effects'
import { all } from 'typed-redux-saga'
import { Socket } from 'socket.io-client'
import { messagesActions } from './messages.slice'
import { sendMessageSaga } from './sendMessage/sendMessage.saga'
import { incomingMessagesSaga } from './incomingMessages/incomingMessages.saga'
import { publicChannelsActions } from '../publicChannels/publicChannels.slice'
import { verifyMessagesSaga } from './verifyMessage/verifyMessages.saga'
import { updateMessagesSendingStatusSaga } from './updateMessagesSendingStatus/updateMessagesSendingStatus.saga'

export function* messagesMasterSaga(socket: Socket): Generator {
  yield all([
    takeEvery(messagesActions.sendMessage.type, sendMessageSaga, socket),
    takeEvery(messagesActions.incomingMessages.type, incomingMessagesSaga),
    takeEvery(publicChannelsActions.cacheMessages.type, verifyMessagesSaga),
    takeEvery(publicChannelsActions.cacheMessages.type, updateMessagesSendingStatusSaga)
  ])
}
