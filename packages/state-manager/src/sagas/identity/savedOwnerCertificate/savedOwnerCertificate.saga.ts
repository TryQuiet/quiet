import { type Socket, applyEmitParams } from '../../../types'
import { select, apply, put } from 'typed-redux-saga'
import { type PayloadAction } from '@reduxjs/toolkit'
import { identityActions } from '../identity.slice'
import { identitySelectors } from '../../identity/identity.selectors'
import { communitiesActions } from '../../communities/communities.slice'
import { communitiesSelectors } from '../../communities/communities.selectors'
import { publicChannelsActions } from '../../publicChannels/publicChannels.slice'
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

  if (!identity) return

  const payload: InitCommunityPayload = {
    id: communityId,
    name: community?.name,
    peerId: identity.peerId,
    hiddenService: identity.hiddenService,
  }

  // TODO: We can save the owner's certificate when creating the community
  // instead of doing this.
  const createdCommunity = yield* apply(
    socket,
    socket.emitWithAck,
    applyEmitParams(SocketActionTypes.CREATE_COMMUNITY, payload)
  )
  yield* put(communitiesActions.updateCommunityData(createdCommunity))

  // TODO: Community metadata should already exist on the backend after creating
  // the community.
  yield* put(communitiesActions.sendCommunityMetadata())
  yield* put(publicChannelsActions.createGeneralChannel())
  // TODO: We may be able to provide this when creating the community.
  yield* put(identityActions.saveUserCsr())
}
