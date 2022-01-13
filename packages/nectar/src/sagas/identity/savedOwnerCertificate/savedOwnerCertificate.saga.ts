import { Socket } from 'socket.io-client'
import { select, apply } from 'typed-redux-saga'
import { SocketActionTypes } from '../../socket/const/actionTypes'
import { PayloadAction } from '@reduxjs/toolkit'
import { identityActions } from '../identity.slice'
import { communitiesSelectors } from '../../communities/communities.selectors'
import { identitySelectors } from '../identity.selectors'

export function* savedOwnerCertificateSaga(
  socket: Socket,
  action: PayloadAction<ReturnType<typeof identityActions.savedOwnerCertificate>['payload']>
): Generator {
  let communityId: string = action.payload

  if (!communityId) {
    communityId = yield* select(communitiesSelectors.currentCommunityId)
  }

  const community = yield* select(communitiesSelectors.selectById(communityId))
  const identity = yield* select(identitySelectors.selectById(communityId))

  const cert = identity.userCertificate
  const key = identity.userCsr.userKey
  const ca = community.rootCa

  const certs = {
    cert,
    key,
    ca
  }
  yield* apply(socket, socket.emit, [
    SocketActionTypes.CREATE_COMMUNITY,
    communityId,
    identity.peerId,
    identity.hiddenService,
    certs
  ])
}
