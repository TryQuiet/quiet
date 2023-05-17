import { PayloadAction } from '@reduxjs/toolkit'
import { apply } from 'typed-redux-saga'
import { appActions } from './app.slice'
import { SocketActionTypes } from '../socket/const/actionTypes'
import { Socket } from '../../types'

export function* closeServicesSaga(
  socket: Socket,
  _action: PayloadAction<ReturnType<typeof appActions.closeServices>['payload']>
): Generator {
  yield* apply(socket, socket.emit, [SocketActionTypes.LEAVE_COMMUNITY])
}
