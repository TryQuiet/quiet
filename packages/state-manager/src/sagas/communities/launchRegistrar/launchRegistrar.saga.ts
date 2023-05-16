import { apply, select } from 'typed-redux-saga'
import { PayloadAction } from '@reduxjs/toolkit'
import { applyEmitParams, Socket } from '../../../types'
import { SocketActionTypes } from '../../socket/const/actionTypes'
import { identitySelectors } from '../../identity/identity.selectors'

import { communitiesSelectors } from '../communities.selectors'
import { communitiesActions } from '../communities.slice'
import { LaunchRegistrarPayload } from '@quiet/types'

export function* launchRegistrarSaga(
  socket: Socket,
  action: PayloadAction<ReturnType<typeof communitiesActions.launchRegistrar>['payload'] | undefined>
): Generator {
  let communityId: string | undefined = action.payload

  if (!communityId) {
    communityId = yield* select(communitiesSelectors.currentCommunityId)
  }

  const community = yield* select(communitiesSelectors.selectById(communityId))
  if (!community || !community.privateKey) {
    console.error('Could not launch registrar, Community is lacking data')
    return
  }
  if (community.CA?.rootCertString) {
    const identity = yield* select(identitySelectors.selectById(communityId))
    if (!identity) {
      console.error('Could not launch registrar, Identity is lacking data')
      return
    }
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
