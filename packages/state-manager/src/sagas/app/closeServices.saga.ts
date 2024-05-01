import { type PayloadAction } from '@reduxjs/toolkit'
import { apply } from 'typed-redux-saga'
import { type appActions } from './app.slice'
import { type Socket } from '../../types'
import { SocketActionTypes } from '@quiet/types'

export function* closeServicesSaga(
  socket: Socket,
  _action: PayloadAction<ReturnType<typeof appActions.closeServices>['payload']>
): Generator {
  yield* apply(socket, socket.emitWithAck, [SocketActionTypes.LEAVE_COMMUNITY])
}
