import { type Socket, applyEmitParams } from '../../../types'
import { select, apply } from 'typed-redux-saga'
import { type PayloadAction } from '@reduxjs/toolkit'
import { type identityActions } from '../identity.slice'
import { communitiesSelectors } from '../../communities/communities.selectors'
import { identitySelectors } from '../identity.selectors'
import { type InitCommunityPayload, SocketActionTypes } from '@quiet/types'

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
  if (!identity?.userCertificate || !identity?.userCsr || !community?.rootCa) return

  const payload: InitCommunityPayload = {
    id: communityId,
    peerId: identity.peerId,
    hiddenService: identity.hiddenService,
    certs: {
      certificate: identity.userCertificate,
      key: identity.userCsr.userKey,
      CA: [community.rootCa],
    },
  }

  yield* apply(socket, socket.emit, applyEmitParams(SocketActionTypes.CREATE_COMMUNITY, payload))
}
