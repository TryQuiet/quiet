import { PayloadAction } from '@reduxjs/toolkit'
import { Socket } from '../../types'
import { apply } from 'typed-redux-saga'
import { appActions } from './app.slice'
import { SocketActionTypes } from '../socket/const/actionTypes'

export function* closeServicesSaga(
  socket: Socket,
  _action: PayloadAction<ReturnType<typeof appActions.closeServices>['payload']>
): Generator {
  const params: [p: SocketActionTypes.CLOSE] = [SocketActionTypes.CLOSE]
  yield* apply(socket, socket.emit, params)
}
