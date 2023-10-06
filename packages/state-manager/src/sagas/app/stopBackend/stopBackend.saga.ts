// @ts-nocheck
import { PayloadAction } from '@reduxjs/toolkit'
import { apply } from 'typed-redux-saga'
import { appActions } from '../app.slice'
import { Socket } from '../../../types'
import { SocketActionTypes } from '@quiet/types'

export function* stopBackendSaga(
  socket: Socket,
  _action: PayloadAction<ReturnType<typeof appActions.stopBackend>['payload']>
): Generator {
  yield* apply(socket, socket.emit, [SocketActionTypes.CLOSE])
}
