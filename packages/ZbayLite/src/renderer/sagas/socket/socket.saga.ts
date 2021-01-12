import * as io from 'socket.io-client'
import { PublicChannelsActions, publicChannelsActions } from '../publicChannels/publicChannels.reducer'
import respones from 'tlg-manager/lib/socket/constantsReponse.d'
import { eventChannel, Channel } from 'redux-saga'
import { fork, put } from 'redux-saga/effects'
import { call, take } from 'typed-redux-saga'
import { ActionFromMapping, ChatMessages } from '../publicChannels/actionsTypes'
import config from '../../config'
import { AnyAction } from 'redux'

export const connect = async () => {
  const socket = io(config.socket.address)
  return await new Promise(resolve => {
    socket.on('connect', () => {
      resolve(socket)
    })
  })
}

export function subscribe (socket) {
  return eventChannel<ActionFromMapping<PublicChannelsActions>>(emit => {
    socket.on(respones.EventTypesResponse.RESPONSE_FETCH_ALL_MESSAGES, ({ messages }) => {
      emit(publicChannelsActions.loadAllMessages(messages))
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

export function* emitActions(socket): Generator {
  while (true) {
    yield take('test')
    socket.emit('message')
  }
}

export function* useIO(socket): Generator {
  yield fork(handleActions, socket)
  yield fork(emitActions, socket)
}

export function* startConnection(): Generator {
  while (true) {
    yield take(ChatMessages.CONNECT_TO_WEBSOCKET_SERVER)
    const socket = yield call(connect)
    yield fork(useIO, socket)
  }
}
