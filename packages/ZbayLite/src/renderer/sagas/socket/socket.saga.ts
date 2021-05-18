import { io, Socket } from 'socket.io-client'
import crypto from 'crypto'
import lodash from 'lodash'
import {
  PublicChannelsActions,
  publicChannelsActions
} from '../publicChannels/publicChannels.reducer'
import {
  directMessagesActions,
  DirectMessagesActions
} from '../directMessages/directMessages.reducer'
import { eventChannel } from 'redux-saga'
import { transferToMessage } from '../publicChannels/publicChannels.saga'
import { fork, takeEvery } from 'redux-saga/effects'
import { call, take, select, put, takeLeading, all, apply } from 'typed-redux-saga'
import { ActionFromMapping, Socket as socketsActions } from '../const/actionsTypes'
import channelSelectors from '../../store/selectors/channel'
import identitySelectors from '../../store/selectors/identity'
import directMessagesSelectors from '../../store/selectors/directMessages'
import usersSelectors from '../../store/selectors/users'
import { messages } from '../../zbay'
import config from '../../config'
import { messageType } from '../../../shared/static'
import { ipcRenderer } from 'electron'
import { PayloadAction } from '@reduxjs/toolkit'

import { encodeMessage } from '../../cryptography/cryptography'

export const connect = async (): Promise<Socket> => {
  const socket = io(config.socket.address)
  return await new Promise(resolve => {
    socket.on('connect', async () => {
      ipcRenderer.send('connectionReady')
      resolve(socket)
    })
  })
}

export function subscribe(socket) {
  return eventChannel<ActionFromMapping<PublicChannelsActions & DirectMessagesActions>>(emit => {
    socket.on(socketsActions.MESSAGE, payload => {
      emit(publicChannelsActions.loadMessage(payload))
    })
    socket.on(socketsActions.RESPONSE_FETCH_ALL_MESSAGES, payload => {
      emit(publicChannelsActions.responseLoadAllMessages(payload))
    })
    socket.on(socketsActions.RESPONSE_GET_PUBLIC_CHANNELS, payload => {
      emit(publicChannelsActions.responseGetPublicChannels(payload))
    })
    // Direct messages
    socket.on(socketsActions.DIRECT_MESSAGE, payload => {
      console.log('respnse direct message')
      emit(directMessagesActions.responseLoadDirectMessage(payload))
    })
    socket.on(socketsActions.RESPONSE_FETCH_ALL_DIRECT_MESSAGES, payload => {
      emit(directMessagesActions.responseLoadAllDirectMessages(payload))
    })
    socket.on(socketsActions.RESPONSE_GET_AVAILABLE_USERS, payload => {
      emit(directMessagesActions.responseGetAvailableUsers(payload))
    })
    socket.on(socketsActions.RESPONSE_GET_PRIVATE_CONVERSATIONS, payload => {
      emit(directMessagesActions.responseGetPrivateConversations(payload))
    })
    return () => {}
  })
}

export function* handleActions(socket: Socket): Generator {
  const socketChannel = yield* call(subscribe, socket)
  while (true) {
    const action = yield* take(socketChannel)
    yield put(action)
  }
}

export function* sendMessage(socket: Socket): Generator {
  yield* take(`${publicChannelsActions.sendMessage}`)
  const { address } = yield* select(channelSelectors.channel)
  const messageToSend = yield* select(channelSelectors.message)
  const users = yield* select(usersSelectors.users)
  let message = null
  const privKey = yield* select(identitySelectors.signerPrivKey)
  message = messages.createMessage({
    messageData: {
      type: messageType.BASIC,
      data: messageToSend
    },
    privKey: privKey
  })
  const messageDigest = crypto.createHash('sha256')
  const messageEssentials = lodash.pick(message, ['createdAt', 'message'])
  const key = messageDigest.update(JSON.stringify(messageEssentials)).digest('hex')
  const preparedMessage = {
    ...message,
    id: key,
    typeIndicator: false,
    signature: message.signature.toString('base64')
  }
  const displayableMessage = transferToMessage(preparedMessage, users)
  yield put(
    publicChannelsActions.addMessage({
      key: address,
      message: { [preparedMessage.id]: displayableMessage }
    })
  )
  yield* apply(socket, socket.emit, [
    socketsActions.SEND_MESSAGE,
    {
      channelAddress: address,
      message: preparedMessage
    }
  ])
}

export function* subscribeForTopic(
  socket: Socket,
  { payload }: PayloadAction<typeof publicChannelsActions.subscribeForTopic>
): Generator {
  yield* apply(socket, socket.emit, [socketsActions.SUBSCRIBE_FOR_TOPIC, payload])
}

export function* fetchAllMessages(
  socket: Socket,
  { payload }: PayloadAction<typeof publicChannelsActions.loadAllMessages>
): Generator {
  yield* apply(socket, socket.emit, [socketsActions.FETCH_ALL_MESSAGES, payload])
}

export function* getPublicChannels(socket: Socket): Generator {
  yield* apply(socket, socket.emit, [socketsActions.GET_PUBLIC_CHANNELS])
}

// Direct Messages

export function* subscribeForDirectMessageThread(
  socket: Socket,
  { payload }: PayloadAction<typeof directMessagesActions.subscribeForDirectMessageThread>
): Generator {
  yield* apply(socket, socket.emit, [socketsActions.SUBSCRIBE_FOR_DIRECT_MESSAGE_THREAD, payload])
}

export function* getAvailableUsers(socket: Socket): Generator {
  yield* apply(socket, socket.emit, [socketsActions.GET_AVAILABLE_USERS])
}

export function* initializeConversation(
  socket: Socket,
  { payload }: PayloadAction<typeof directMessagesActions.initializeConversation>
): Generator {
  yield* apply(socket, socket.emit, [socketsActions.INITIALIZE_CONVERSATION, payload])
}

export function* getPrivateConversations(socket: Socket): Generator {
  yield* apply(socket, socket.emit, [socketsActions.GET_PRIVATE_CONVERSATIONS])
}

export function* sendDirectMessage(socket: Socket): Generator {
  console.log('inside senddirectmessage saga')
  const { id } = yield* select(channelSelectors.channel)
  const conversations = yield* select(directMessagesSelectors.conversations)
  const conversationId = conversations[id].conversationId
  const sharedSecret = conversations[id].sharedSecret
  const messageToSend = yield* select(channelSelectors.message)
  let message = null
  const privKey = yield* select(identitySelectors.signerPrivKey)
  message = messages.createMessage({
    messageData: {
      type: messageType.BASIC,
      data: messageToSend
    },
    privKey: privKey
  })
  const messageDigest = crypto.createHash('sha256')
  const messageEssentials = lodash.pick(message, ['createdAt', 'message'])
  const key = messageDigest.update(JSON.stringify(messageEssentials)).digest('hex')
  const preparedMessage = {
    ...message,
    id: key,
    typeIndicator: false,
    signature: message.signature.toString('base64')
  }
  const stringifiedMessage = JSON.stringify(preparedMessage)
  const encryptedMessage = encodeMessage(sharedSecret, stringifiedMessage)
  yield* apply(socket, socket.emit, [
    socketsActions.SEND_DIRECT_MESSAGE,
    {
      channelAddress: conversationId,
      message: encryptedMessage
    }
  ])
}

export function* addWaggleIdentity(socket: Socket): Generator {
  while (true) {
    yield take('SET_IS_WAGGLE_CONNECTED')

    let wagglePublicKey = yield select(directMessagesSelectors.publicKey)
    let signerPublicKey = yield select(identitySelectors.signerPubKey)

    if (wagglePublicKey && signerPublicKey) {
      yield* apply(socket, socket.emit, [
        socketsActions.ADD_USER,
        {
          publicKey: signerPublicKey,
          halfKey: wagglePublicKey
        }
      ])
    }

    yield take('SET_PUBLIC_KEY')

    wagglePublicKey = yield select(directMessagesSelectors.publicKey)
    signerPublicKey = yield select(identitySelectors.signerPubKey)

    if (wagglePublicKey && signerPublicKey) {
      yield* apply(socket, socket.emit, [
        socketsActions.ADD_USER,
        {
          publicKey: signerPublicKey,
          halfKey: wagglePublicKey
        }
      ])
    }
  }
}

export function* useIO(socket: Socket): Generator {
  yield all([
    fork(handleActions, socket),
    takeEvery(publicChannelsActions.sendMessage.type, sendMessage, socket),
    takeEvery(publicChannelsActions.loadAllMessages.type, fetchAllMessages, socket),
    takeEvery(publicChannelsActions.subscribeForTopic.type, subscribeForTopic, socket),
    takeLeading(publicChannelsActions.getPublicChannels.type, getPublicChannels, socket),
    takeLeading(directMessagesActions.getAvailableUsers.type, getAvailableUsers, socket),
    takeEvery(
      directMessagesActions.initializeConversation.type,
      initializeConversation,
      socket
    ),
    takeEvery(directMessagesActions.sendDirectMessage.type, sendDirectMessage, socket),
    takeLeading(
      directMessagesActions.getPrivateConversations.type,
      getPrivateConversations,
      socket
    ),
    takeEvery(
      `${socketsActions.SUBSCRIBE_FOR_DIRECT_MESSAGE_THREAD}`,
      subscribeForDirectMessageThread,
      socket
    ),
    fork(addWaggleIdentity, socket)
  ])
}

export function* startConnection(): Generator {
  const socket = yield* call(connect)
  yield fork(useIO, socket)
}

export function* socketSaga(): Generator {
  yield all([takeEvery(socketsActions.CONNECT_TO_WEBSOCKET_SERVER, startConnection)])
}
