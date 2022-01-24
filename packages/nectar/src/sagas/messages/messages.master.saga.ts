import { takeEvery } from 'redux-saga/effects'
import { Socket } from 'socket.io-client'
import { all } from 'typed-redux-saga'
import { publicChannelsActions } from '../publicChannels/publicChannels.slice'
import { messagesActions } from './messages.slice'
import { sendMessageSaga } from './sendMessage/sendMessage.saga'
import { verifyMessagesSaga } from './verifyMessage/verifyMessages.saga'

export function* messagesMasterSaga(socket: Socket): Generator {
  yield all([
    takeEvery(messagesActions.sendMessage.type, sendMessageSaga, socket),
    takeEvery(publicChannelsActions.incomingMessages.type, verifyMessagesSaga)
  ])
}
