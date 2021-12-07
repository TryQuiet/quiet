import { io, Socket } from 'socket.io-client'
import { call, fork, put } from 'typed-redux-saga'
import { PayloadAction } from '@reduxjs/toolkit'
import { socket as nectar } from '@zbayapp/nectar'
import { socketActions } from './socket.slice'

export function* startConnectionSaga(
  action: PayloadAction<ReturnType<typeof socketActions.startConnection>['payload']>
): Generator {
  const socket = yield* call(connect, action.payload.dataPort)
  yield* fork(nectar.useIO, socket)
  yield* put(socketActions.setConnected())
}

export const connect = async (dataPort: number): Promise<Socket> => {
  console.log('starting websocket connection')
  const socket = io(`http://localhost:${dataPort}`)
  return await new Promise(resolve => {
    socket.on('connect', async () => {
      console.log('websocket connected')
      resolve(socket)
    })
  })
}
