import { io } from 'socket.io-client'
import crypto from 'crypto'
import * as R from 'ramda'
import {
  PublicChannelsActions,
  publicChannelsActions
} from '../publicChannels/publicChannels.reducer'
import { eventChannel } from 'redux-saga'
import { fork, put } from 'redux-saga/effects'
import { call, take, select } from 'typed-redux-saga'
import { ActionFromMapping, Socket as socketsActions } from '../const/actionsTypes'
import channelSelectors from '../../store/selectors/channel'
import identitySelectors from '../../store/selectors/identity'
import usersSelectors from '../../store/selectors/users'
import contactsHandlers from '../../store/handlers/contacts'
import { messages } from '../../zbay'
import config from '../../config'
import { messageType } from '../../../shared/static'
import { DisplayableMessage } from '../../zbay/messages.types'

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
    socket.on(socketsActions.RESPONSE_FETCH_ALL_MESSAGES, payload => {
      emit(publicChannelsActions.loadAllMessages(payload))
    })
    socket.on(socketsActions.MESSAGE, payload => {
      console.log('new message', payload)
      emit(publicChannelsActions.loadAllMessages(payload))
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
    console.log('working here2313')
    const myUser = yield* select(usersSelectors.myUser)
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
    const messageEssentials = R.pick(['createdAt', 'message'])(message)
    const key = messageDigest.update(JSON.stringify(messageEssentials)).digest('hex')
    const messagePlaceholder = new DisplayableMessage({
      ...message,
      id: key,
      sender: {
        replyTo: myUser.address,
        username: myUser.nickname
      },
      fromYou: true,
      status: 'pending',
      message: messageToSend
    })
    yield put(
      contactsHandlers.actions.addMessage({
        key: address,
        message: { [key]: messagePlaceholder }
      })
    )
    const preparedMessage = {
      ...message,
      id: key,
      typeIndicator: false
    }
    socket.emit(socketsActions.SEND_MESSAGE, { channelAddress: address, message: preparedMessage })
  }
}

export function* subscribeForTopic(socket): Generator {
  while (true) {
    const { payload } = yield* take(`${publicChannelsActions.subscribeForTopic}`)
    console.log(payload)
    socket.emit(socketsActions.SUBSCRIBE_FOR_TOPIC, payload)
  }
}

export function* fetchAllMessages(socket): Generator {
  while (true) {
    const { payload } = yield* take(`${publicChannelsActions.loadAllMessages}`)
    socket.emit(socketsActions.FETCH_ALL_MESSAGES, payload)
  }
}

export function* useIO(socket): Generator {
  yield fork(handleActions, socket)
  yield fork(sendMessage, socket)
  yield fork(fetchAllMessages, socket)
  yield fork(subscribeForTopic, socket)
}

export function* startConnection(): Generator {
  while (true) {
    yield take(socketsActions.CONNECT_TO_WEBSOCKET_SERVER)
    const socket = yield call(connect)
    yield fork(useIO, socket)
  }
}
