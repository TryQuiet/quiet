import { io, Socket } from 'socket.io-client'
import { call, fork, put } from 'typed-redux-saga'
import { socket as nectar } from '@zbayapp/nectar'
import config from '../../config'
import { socketActions } from './socket.slice'

export function* startConnectionSaga(): Generator {
  const socket = yield* call(connect)
  yield* fork(nectar.useIO, socket)
  yield* put(socketActions.setConnected())
}

export const connect = async (): Promise<Socket> => {
  console.log('starting websocket connection')
  const socket = io(config.socket.address)
  return await new Promise(resolve => {
    socket.on('connect', async () => {
      console.log('websocket connected')
      resolve(socket)
    })
  })
}
