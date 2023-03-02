import { apply, select } from 'typed-redux-saga'
import { PayloadAction } from '@reduxjs/toolkit'
import { applyEmitParams, Socket } from '../../../types'
import { SocketActionTypes } from '../../socket/const/actionTypes'
import { identitySelectors } from '../../identity/identity.selectors'

import { communitiesSelectors } from '../communities.selectors'
import { communitiesActions } from '../communities.slice'
import { LaunchRegistrarPayload } from '../communities.types'

export function* launchRegistrarSaga(
  socket: Socket,
  action: PayloadAction<ReturnType<typeof communitiesActions.launchRegistrar>['payload']>
): Generator {
  let communityId: string = action.payload

  if (!communityId) {
    communityId = yield* select(communitiesSelectors.currentCommunityId)
  }

  const community = yield* select(communitiesSelectors.selectById(communityId))

  if (community.CA?.rootCertString) {
    const identity = yield* select(identitySelectors.selectById(communityId))
    const payload: LaunchRegistrarPayload = {
      id: identity.id,
      peerId: identity.peerId.id,
      rootCertString: community.CA.rootCertString,
      rootKeyString: community.CA.rootKeyString,
      privateKey: community.privateKey
    }
    yield* apply(socket, socket.emit, applyEmitParams(SocketActionTypes.LAUNCH_REGISTRAR, payload))
  }
}
