import { io, Socket } from 'socket.io-client'
import { call, fork, put } from 'typed-redux-saga'
import { socket } from '@zbayapp/nectar'
import config from '../../config'
import { socketActions } from './socket.slice'

export function* startConnectionSaga(): Generator {
  const _socket = yield* call(connect)
  // @ts-expect-error
  yield* fork(socket.useIO, _socket)
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
