import { type PayloadAction } from '@reduxjs/toolkit'
import { SocketActions } from '@quiet/types'
import { apply } from 'typed-redux-saga'
import { applyEmitParams, type Socket } from '../../../types'
import { communitiesActions } from '../communities.slice'

export function* debugAddServerSaga(
  socket: Socket,
  action: PayloadAction<ReturnType<typeof communitiesActions.debugAddServer>['payload']>
): Generator {
  yield* apply(socket, socket.emit, applyEmitParams(SocketActions.DEBUG_ADD_SERVER, action.payload))
}
