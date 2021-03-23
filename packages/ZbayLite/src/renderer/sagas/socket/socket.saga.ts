import { io } from 'socket.io-client'
import crypto from 'crypto'
import * as R from 'ramda'
import {
  PublicChannelsActions,
  publicChannelsActions
} from '../publicChannels/publicChannels.reducer'
import { eventChannel } from 'redux-saga'
import { transferToMessage } from '../publicChannels/publicChannels.saga'
import { fork } from 'redux-saga/effects'
import { call, take, select, put } from 'typed-redux-saga'
import { ActionFromMapping, Socket as socketsActions } from '../const/actionsTypes'
import channelSelectors from '../../store/selectors/channel'
import identitySelectors from '../../store/selectors/identity'
import usersSelectors from '../../store/selectors/users'
import { messages } from '../../zbay'
import config from '../../config'
import { messageType } from '../../../shared/static'

export const connect = async () => {
  const socket = io(config.socket.address)
  return await new Promise(resolve => {
    socket.on('connect', () => {
      resolve(socket)
    })
  })
}

export function subscribe(socket) {
  return eventChannel<ActionFromMapping<PublicChannelsActions>>(emit => {
    socket.on(socketsActions.MESSAGE, payload => {
      emit(publicChannelsActions.loadMessage(payload))
    })
    socket.on(socketsActions.RESPONSE_FETCH_ALL_MESSAGES, payload => {
      emit(publicChannelsActions.responseLoadAllMessages(payload))
    })
    socket.on(socketsActions.RESPONSE_GET_PUBLIC_CHANNELS, payload => {
      emit(publicChannelsActions.responseGetPublicChannels(payload))
    })
    return () => {}
  })
}

export function* handleActions(socket): Generator {
  const socketChannel = yield* call(subscribe, socket)
  while (true) {
    const action = yield* take(socketChannel)
    yield put(action)
  }
}

export function* sendMessage(socket): Generator {
  while (true) {
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
    const messageEssentials = R.pick(['createdAt', 'message'])(message)
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
    socket.emit(socketsActions.SEND_MESSAGE, { channelAddress: address, message: preparedMessage })
  }
}

export function* subscribeForTopic(socket): Generator {
  while (true) {
    const { payload } = yield* take(`${publicChannelsActions.subscribeForTopic}`)
    socket.emit(socketsActions.SUBSCRIBE_FOR_TOPIC, payload)
  }
}

export function* fetchAllMessages(socket): Generator {
  while (true) {
    const { payload } = yield* take(`${publicChannelsActions.loadAllMessages}`)
    socket.emit(socketsActions.FETCH_ALL_MESSAGES, payload)
  }
}

export function* getPublicChannels(socket): Generator {
  while (true) {
    yield* take(`${publicChannelsActions.getPublicChannels}`)
    socket.emit(socketsActions.GET_PUBLIC_CHANNELS)
  }
}

export function* useIO(socket): Generator {
  yield fork(handleActions, socket)
  yield fork(sendMessage, socket)
  yield fork(fetchAllMessages, socket)
  yield fork(subscribeForTopic, socket)
  yield fork(getPublicChannels, socket)
}

export function* startConnection(): Generator {
  while (true) {
    yield take(socketsActions.CONNECT_TO_WEBSOCKET_SERVER)
    const socket = yield call(connect)
    yield fork(useIO, socket)
  }
}
