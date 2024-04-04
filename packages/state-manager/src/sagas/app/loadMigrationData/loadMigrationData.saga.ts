import { type PayloadAction } from '@reduxjs/toolkit'
import { apply, select } from 'typed-redux-saga'

import { SocketActionTypes } from '@quiet/types'

import { type appActions } from '../app.slice'
import { type Socket, applyEmitParams } from '../../../types'
import { communitiesSelectors } from '../../communities/communities.selectors'
import { identitySelectors } from '../../identity/identity.selectors'

export function* loadMigrationDataSaga(
  socket: Socket,
  action: PayloadAction<ReturnType<typeof appActions.loadMigrationData>['payload']>
): Generator {
  const keys = action.payload
  const data: Record<string, any> = {}

  for (const key of keys) {
    if (key === 'communities') {
      data[key] = yield* select(communitiesSelectors.selectEntities)
    }

    if (key === 'currentCommunityId') {
      data[key] = yield* select(communitiesSelectors.currentCommunityId)
    }

    if (key === 'identities') {
      data[key] = yield* select(identitySelectors.selectEntities)
    }
  }

  yield* apply(socket, socket.emit, applyEmitParams(SocketActionTypes.LOAD_MIGRATION_DATA, data))
}
