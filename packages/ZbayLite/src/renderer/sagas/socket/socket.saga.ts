import { DateTime } from 'luxon'
import { io, Socket } from 'socket.io-client'
import {
  PublicChannelsActions,
  publicChannelsActions
} from '../publicChannels/publicChannels.reducer'
import {
  directMessagesActions,
  DirectMessagesActions
} from '../directMessages/directMessages.reducer'
import { eventChannel } from 'redux-saga'
import { fork, takeEvery } from 'redux-saga/effects'
import { call, take, select, put, takeLeading, all, apply } from 'typed-redux-saga'
import { ActionFromMapping, Socket as socketsActions } from '../const/actionsTypes'
import channelSelectors from '../../store/selectors/channel'
import identitySelectors from '../../store/selectors/identity'
import directMessagesSelectors from '../../store/selectors/directMessages'
import config from '../../config'
import { messageType, actionTypes } from '../../../shared/static'
import { ipcRenderer } from 'electron'
import { PayloadAction } from '@reduxjs/toolkit'

import { encodeMessage } from '../../cryptography/cryptography'
import { certificatesActions } from '../../store/certificates/certificates.reducer'
import certificatesSelectors from '../../store/certificates/certificates.selector'
import { extractPubKeyString } from '../../pkijs/tests/extractPubKey'
import { signing } from '../../pkijs/tests/sign'
import { loadPrivateKey } from '../../pkijs/generatePems/common'
import configCrypto from '../../pkijs/generatePems/config'
import { arrayBufferToString } from 'pvutils'
import { actions as waggleActions } from '../../store/handlers/waggle'

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
  return eventChannel<
  | ActionFromMapping<PublicChannelsActions & DirectMessagesActions>
  | ReturnType<typeof certificatesActions.responseGetCertificates>
  >(emit => {
    socket.on(socketsActions.MESSAGE, payload => {
      emit(publicChannelsActions.loadMessage(payload))
    })
    socket.on(socketsActions.RESPONSE_FETCH_ALL_MESSAGES, payload => {
      emit(publicChannelsActions.responseLoadAllMessages(payload))
    })
    socket.on(socketsActions.RESPONSE_GET_PUBLIC_CHANNELS, payload => {
      emit(publicChannelsActions.responseGetPublicChannels(payload))
    })
    socket.on(socketsActions.DIRECT_MESSAGE, payload => {
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
    socket.on(socketsActions.RESPONSE_GET_CERTIFICATES, payload => {
      emit(certificatesActions.responseGetCertificates(payload))
    })
    socket.on(socketsActions.SEND_IDS, payload => {
      emit(publicChannelsActions.sendIds(payload))
    })
    return () => { }
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
  const { address } = yield* select(channelSelectors.channel)
  const messageToSend = yield* select(channelSelectors.message)

  const ownCertificate = yield* select(certificatesSelectors.ownCertificate)
  const ownPubKey = yield* call(extractPubKeyString, ownCertificate)
  const privKey = yield* select(certificatesSelectors.ownPrivKey)
  const keyObject = yield* call(loadPrivateKey, privKey, configCrypto.signAlg, configCrypto.hashAlg)
  const sign = yield* call(signing, messageToSend, keyObject)

  const preparedMessage = {
    id: Math.random().toString(36).substr(2, 9),
    type: messageType.BASIC,
    message: messageToSend,
    createdAt: DateTime.utc().toSeconds(),
    signature: arrayBufferToString(sign),
    pubKey: ownPubKey,
    channelId: address
  }

  yield put(
    publicChannelsActions.addMessage({
      key: address,
      message: { [preparedMessage.id]: preparedMessage }
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

export function* subscribeForAllConversations(socket: Socket): Generator {
  const conversations = yield* select(directMessagesSelectors.conversations)
  const payload = Array.from(Object.keys(conversations))
  yield* apply(socket, socket.emit, [socketsActions.SUBSCRIBE_FOR_ALL_CONVERSATIONS, payload])
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
  const { id } = yield* select(channelSelectors.channel)
  const conversations = yield* select(directMessagesSelectors.conversations)
  const conv = Array.from(Object.values(conversations)).filter(item => {
    return item.contactPublicKey === id
  })
  const conversationId = conv[0].conversationId
  const sharedSecret = conv[0].sharedSecret
  const messageToSend = yield* select(channelSelectors.message)

  const ownCertificate = yield* select(certificatesSelectors.ownCertificate)
  const ownPubKey = yield* call(extractPubKeyString, ownCertificate)
  const privKey = yield* select(certificatesSelectors.ownPrivKey)
  const keyObject = yield* call(loadPrivateKey, privKey, configCrypto.signAlg, configCrypto.hashAlg)
  const sign = yield* call(signing, messageToSend, keyObject)

  const preparedMessage = {
    id: Math.random().toString(36).substr(2, 9),
    type: messageType.BASIC,
    message: messageToSend,
    createdAt: DateTime.utc().toSeconds(),
    signature: arrayBufferToString(sign),
    pubKey: ownPubKey,
    channelId: conversationId
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

export function* askForMessages(
  socket: Socket,
  { payload }: PayloadAction<typeof publicChannelsActions.askForMessages>
): Generator {
  yield* apply(socket, socket.emit, [socketsActions.ASK_FOR_MESSAGES, payload])
}

export function* saveCertificate(
  socket: Socket,
  action: PayloadAction<ReturnType<typeof certificatesActions.saveCertificate>['payload']>
): Generator {
  yield* apply(socket, socket.emit, [socketsActions.SAVE_CERTIFICATE, action.payload])
}

export function* responseGetCertificates(socket: Socket): Generator {
  yield* apply(socket, socket.emit, [socketsActions.RESPONSE_GET_CERTIFICATES])
}

export function* addCertificate(): Generator {
  const hasCertyficate = yield* select(certificatesSelectors.ownCertificate)
  const nickname = yield* select(identitySelectors.nickName)
  if (!hasCertyficate && nickname) {
    yield* put(certificatesActions.creactOwnCertificate(nickname))
  }
}

export function* addWaggleIdentity(socket: Socket): Generator {
  const wagglePublicKey = yield select(directMessagesSelectors.publicKey)
  const signerPublicKey = yield select(identitySelectors.signerPubKey)

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

export function* useIO(socket: Socket): Generator {
  yield all([
    fork(handleActions, socket),
    takeEvery(publicChannelsActions.sendMessage.type, sendMessage, socket),
    takeEvery(publicChannelsActions.loadAllMessages.type, fetchAllMessages, socket),
    takeEvery(publicChannelsActions.subscribeForTopic.type, subscribeForTopic, socket),
    takeLeading(publicChannelsActions.getPublicChannels.type, getPublicChannels, socket),
    takeLeading(directMessagesActions.getAvailableUsers.type, getAvailableUsers, socket),
    takeEvery(publicChannelsActions.askForMessages.type, askForMessages, socket),
    takeEvery(directMessagesActions.initializeConversation.type, initializeConversation, socket),
    takeLeading(
      directMessagesActions.subscribeForAllConversations.type,
      subscribeForAllConversations,
      socket
    ),
    takeEvery(directMessagesActions.sendDirectMessage.type, sendDirectMessage, socket),
    takeEvery(certificatesActions.saveCertificate.type, saveCertificate, socket),
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
    takeEvery(waggleActions.setIsWaggleConnected.type, addWaggleIdentity, socket),
    takeEvery(actionTypes.SET_PUBLIC_KEY, addWaggleIdentity, socket),
    takeEvery(waggleActions.setIsWaggleConnected.type, addCertificate),
    takeEvery(actionTypes.SET_REGISTRATION_STATUS, addCertificate)
  ])
}

export function* startConnection(): Generator {
  const socket = yield* call(connect)
  yield fork(useIO, socket)
}

export function* socketSaga(): Generator {
  yield all([takeEvery(socketsActions.CONNECT_TO_WEBSOCKET_SERVER, startConnection)])
}
