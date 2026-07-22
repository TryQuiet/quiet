import { apply } from 'typed-redux-saga'
import { type PayloadAction } from '@reduxjs/toolkit'
import { applyEmitParams, type Socket } from '../../../types'
import { communitiesActions } from '../communities.slice'
import { SocketActions } from '@quiet/types'

export function* updateCommunityDataSaga(
  socket: Socket,
  action: PayloadAction<ReturnType<typeof communitiesActions.updateCommunityData>['payload']>
): Generator {
  yield* apply(socket, socket.emit, applyEmitParams(SocketActions.UPDATE_COMMUNITY, action.payload))
}
