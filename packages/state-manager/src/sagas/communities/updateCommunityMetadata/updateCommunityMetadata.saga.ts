import { CommunityMetadata, SocketActionTypes } from '@quiet/types'
import { type PayloadAction } from '@reduxjs/toolkit'
import { apply, select, put, take } from 'typed-redux-saga'
import { channel } from 'redux-saga'
import { applyEmitParams, type Socket } from '../../../types'
import { communitiesSelectors } from '../communities.selectors'
import { communitiesActions } from '../communities.slice'
import { identitySelectors } from '../../identity/identity.selectors'

export function* sendCommunityMetadataSaga(
  socket: Socket,
  _action: PayloadAction<ReturnType<typeof communitiesActions.sendCommunityMetadata>['payload']>
): Generator {
  const identity = yield* select(identitySelectors.currentIdentity)
  const community = yield* select(communitiesSelectors.currentCommunity)

  if (!identity?.userCertificate) {
    console.error('Cannot send community metadata, no owner certificate')
    return
  }

  if (!community) {
    console.error('Cannot send community metadata, no community')
    return
  }

  if (!community.rootCa || !community.CA) {
    console.log('Cannot send community metadata, no rootCa or CA in community')
    return
  }

  const communityMetadataPayload: CommunityMetadata = {
    id: community.id,
    ownerCertificate: identity.userCertificate,
    rootCa: community.rootCa,
  }

  const meta = yield* apply(
    socket,
    socket.emitWithAck,
    applyEmitParams(SocketActionTypes.SET_COMMUNITY_METADATA, communityMetadataPayload)
  )

  if (meta) {
    yield* put(communitiesActions.saveCommunityMetadata(meta))
  }
}
