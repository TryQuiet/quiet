import { io, Socket } from 'socket.io-client'
import { socket as nectar } from '@zbayapp/nectar'
import { call, all, fork, takeEvery } from 'typed-redux-saga'
import { Socket as socketsActions } from '../const/actionsTypes'
import config from '../../config'
import { ipcRenderer } from 'electron'

export const connect = async (): Promise<Socket> => {
  console.log('connect')
  const socket = io(config.socket.address)
  return await new Promise(resolve => {
    socket.on('connect', async () => {
      ipcRenderer.send('connectionReady')
      console.log('connections is ready')
      resolve(socket)
    })
  })
}

export function* startConnection(): Generator {
  const socket = yield* call(connect)
  yield* fork(nectar.useIO, socket)
}

export function* socketSaga(): Generator {
  yield all([takeEvery(socketsActions.CONNECT_TO_WEBSOCKET_SERVER, startConnection)])
}
