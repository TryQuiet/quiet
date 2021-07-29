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
import { CertificatesActions, certificatesActions } from '../../store/certificates/certificates.reducer'
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
import { encodeMessage, constants } from '../../cryptography/cryptography'
import certificatesSelectors from '../../store/certificates/certificates.selector'
import { extractPubKeyString, sign, loadPrivateKey, configCrypto, CertFieldsTypes, parseCertificate } from '@zbayapp/identity'
import { arrayBufferToString } from 'pvutils'
import { actions as waggleActions } from '../../store/handlers/waggle'
import directMessagesHandlers, { IConversation } from '../../store/handlers/directMessages'
import crypto from 'crypto'

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
  | ActionFromMapping<PublicChannelsActions & DirectMessagesActions & CertificatesActions>
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
    socket.on(socketsActions.RESPONSE_GET_CERTIFICATE, payload => {
      console.log('RESPONSE_GET_CERTIFICATE', payload)
      emit(certificatesActions.setOwnCertificate(payload))
    })
    socket.on(socketsActions.CERTIFICATE_REGISTRATION_ERROR, payload => {
      console.log('CERTIFICATE_REGISTRATION_ERROR', payload)
      emit(certificatesActions.setRegistrationError(payload))
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

export const createRandomId = (): string => {
  return Math.random().toString(36).substr(2, 9)
}

export const getCreatedAtTime = (): number => {
  return DateTime.utc().toSeconds()
}

export const signArrayBufferToString = (sign: ArrayBuffer) => {
  return arrayBufferToString(sign)
}

export function* sendMessage(socket: Socket): Generator {
  const { address } = yield* select(channelSelectors.channel)
  const messageToSend = yield* select(channelSelectors.message)

  const ownCertificate = yield* select(certificatesSelectors.ownCertificate)
  const ownPubKey = yield* call(extractPubKeyString, ownCertificate)
  const privKey = yield* select(certificatesSelectors.ownPrivKey)
  const keyObject = yield* call(loadPrivateKey, privKey, configCrypto.signAlg)
  const signed = yield* call(sign, messageToSend, keyObject)

  const randomId = yield* call(createRandomId)
  const createdAt = yield* call(getCreatedAtTime)
  const signString = yield* call(signArrayBufferToString, signed)

  const preparedMessage = {
    id: randomId,
    type: messageType.BASIC,
    message: messageToSend,
    createdAt: createdAt,
    signature: signString as string,
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

export const converstionFilter = (conversations: {
  [key: string]: IConversation
}, id: string) => {
  return Array.from(Object.values(conversations)).filter(item => {
    return item.contactPublicKey === id
  })
}

export const encryptMessage = (sharedSecret, stringifiedMessage) => {
  return encodeMessage(sharedSecret, stringifiedMessage)
}

export const computeSecrets = (dh, halfKey) => {
  return dh.computeSecret(halfKey, 'hex').toString('hex')
}

export const getPublicKey = (dh): string => {
  return dh.getPublicKey('hex')
}

export const parseMessage = (preparedMessage) => {
  return JSON.stringify(preparedMessage)
}

export function* sendDirectMessage(socket: Socket): Generator {
  const { id } = yield* select(channelSelectors.channel)
  let conversations = yield* select(directMessagesSelectors.conversations)

  let conv = yield* call(converstionFilter, conversations, id)
  let conversationId
  let sharedSecret

  if (!conv[0]) {
    const contactChannel = yield* select(channelSelectors.channel)
    const contactPublicKey = contactChannel.id

    const myPublicKey = yield* select(identitySelectors.signerPubKey)
    const contactPubKey = yield* select(directMessagesSelectors.user(contactPublicKey))
    const halfKey = contactPubKey.halfKey

    const dh = crypto.createDiffieHellman(constants.prime, 'hex', constants.generator, 'hex')
    dh.generateKeys()

    const pubKey = yield* call(getPublicKey, dh)

    sharedSecret = yield* call(computeSecrets, dh, halfKey)

    const encryptedPhrase = yield* call(encryptMessage, sharedSecret, `no panic${myPublicKey}`)

    yield* put(
      directMessagesHandlers.actions.addConversation({
        sharedSecret,
        contactPublicKey: contactPublicKey,
        conversationId: pubKey
      })
    )

    yield* put(
      directMessagesActions.initializeConversation({
        address: pubKey,
        encryptedPhrase
      })
    )

    conversations = yield* select(directMessagesSelectors.conversations)
    conv = yield* call(converstionFilter, conversations, id)
    conversationId = pubKey
  } else {
    conversationId = conv[0].conversationId
    sharedSecret = conv[0].sharedSecret
  }

  const messageToSend = yield* select(channelSelectors.message)

  const ownCertificate = yield* select(certificatesSelectors.ownCertificate)
  const ownPubKey = yield* call(extractPubKeyString, ownCertificate)
  const privKey = yield* select(certificatesSelectors.ownPrivKey)
  const keyObject = yield* call(loadPrivateKey, privKey, configCrypto.signAlg)
  const signed = yield* call(sign, messageToSend, keyObject)

  const preparedMessage = {
    id: Math.random().toString(36).substr(2, 9),
    type: messageType.BASIC,
    message: messageToSend,
    createdAt: DateTime.utc().toSeconds(),
    signature: arrayBufferToString(signed),
    pubKey: ownPubKey,
    channelId: conversationId
  }

  const stringifiedMessage = yield* call(parseMessage, preparedMessage)

  const encryptedMessage = yield* call(encryptMessage, sharedSecret, stringifiedMessage)

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

export function* registerUserCertificate(
  socket: Socket,
  action: PayloadAction<ReturnType<typeof certificatesActions.registerUserCertificate>['payload']>
): Generator {
  yield* apply(socket, socket.emit, [socketsActions.REGISTER_USER_CERTIFICATE, action.payload.serviceAddress, action.payload.userCsr])
}

export function* responseGetCertificates(socket: Socket): Generator {
  yield* apply(socket, socket.emit, [socketsActions.RESPONSE_GET_CERTIFICATES])
}

export function* addCertificate(): Generator {
  const hasCertyficate = yield* select(certificatesSelectors.ownCertificate)
  const nickname = yield* select(identitySelectors.nickName)
  let parsedCert
  let updateCertificate = false

  if (hasCertyficate) {
    parsedCert = yield* call(parseCertificate, hasCertyficate)
  }

  const certFieldsArray = Object.keys(CertFieldsTypes)

  for (let i = 0; i < certFieldsArray.length; i++) {
    if (hasCertyficate && !parsedCert.subject.typesAndValues[i]) {
      updateCertificate = true
    }
  }

  if ((!hasCertyficate && nickname) || updateCertificate) {
    console.log('Calling createOwnCertificate')
    yield* put(certificatesActions.createOwnCertificate(nickname))
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
    takeLeading(certificatesActions.registerUserCertificate.type, registerUserCertificate, socket),
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
