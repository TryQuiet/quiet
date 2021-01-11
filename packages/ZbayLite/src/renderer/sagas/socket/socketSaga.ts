import * as io from 'socket.io-client'
import { eventChannel } from 'redux-saga'
import {take, call, fork, put } from 'redux-saga/effects';
import { ChatMessages } from '../publicChannels/actionsTypes'
import config from '../../config'

export const connect = async () => {
  const socket = io(config.socket.address)
  return await new Promise(resolve => {
    socket.on('connect', () => {
      resolve(socket)
    })
  })
}

export const subscribe = (socket) => {
  return eventChannel(emit => {
    socket.on()
  })
}

export function* handleAcions(socket): Generator {
  const channel = yield call(subscribe, socket)
  while(true) {
    const action = yield take(channel)
    yield put(action)
  }
}

export function* useIO(socker): Generator {
  yield fork(handleActions, socket)
  yield fork(emitActions socket)
}

export function* startConnection(): Generator {
  while (true) {
    yield take(ChatMessages.CONNECT_TO_WEBSOCKET_SERVER)
    const socket = yield call(connect)
  }
}
