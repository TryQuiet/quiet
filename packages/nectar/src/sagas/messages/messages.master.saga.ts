import { takeEvery } from 'redux-saga/effects'
import { Socket } from 'socket.io-client'
import { all } from 'typed-redux-saga'
import { publicChannelsActions } from '../publicChannels/publicChannels.slice'
import { messagesActions } from './messages.slice'
import { sendMessageSaga } from './sendMessage/sendMessage.saga'
import { verifyMessageSaga } from './verifyMessage/verifyMessage.saga'

export function* messagesMasterSaga(socket: Socket): Generator {
  yield all([
    takeEvery(messagesActions.sendMessage.type, sendMessageSaga, socket),
    takeEvery(publicChannelsActions.onMessagePosted.type, verifyMessageSaga)
  ])
}
