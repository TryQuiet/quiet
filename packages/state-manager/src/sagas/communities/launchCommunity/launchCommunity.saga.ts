import { apply, select, put, call } from 'typed-redux-saga'
import { type PayloadAction } from '@reduxjs/toolkit'
import { applyEmitParams, type Socket } from '../../../types'
import { identitySelectors } from '../../identity/identity.selectors'
import { communitiesSelectors } from '../communities.selectors'
import { communitiesActions } from '../communities.slice'
import { connectionActions } from '../../appConnection/connection.slice'
import { getCurrentTime } from '../../messages/utils/message.utils'
import { connectionSelectors } from '../../appConnection/connection.selectors'
import { networkSelectors } from '../../network/network.selectors'
import { pairsToP2pAddresses } from '@quiet/common'
import { type Community, type InitCommunityPayload, SocketActionTypes } from '@quiet/types'

export function* initCommunities(): Generator {
  const joinedCommunities = yield* select(identitySelectors.joinedCommunities)

  const initializedCommunities = yield* select(networkSelectors.initializedCommunities)
  for (const community of joinedCommunities) {
    if (!initializedCommunities[community.id]) {
      yield* put(communitiesActions.launchCommunity(community.id))
    }
  }

  const currentTime = yield* call(getCurrentTime)
  yield* put(connectionActions.setLastConnectedTime(currentTime))
}

export function* launchCommunitySaga(
  socket: Socket,
  action: PayloadAction<ReturnType<typeof communitiesActions.launchCommunity>['payload']>
): Generator {
  console.log('LAUNCH COMMUNITY SAGA')
  const communityId = action.payload

  if (!communityId) {
    console.error('Could not launch community, missing community ID')
    return
  }

  const community = yield* select(communitiesSelectors.selectById(communityId))
  const identity = yield* select(identitySelectors.selectById(communityId))

  if (!community || !identity?.userCsr?.userKey) {
    console.error('Could not launch community, missing community or user private key')
    return
  }

  const invitationCodes = yield* select(communitiesSelectors.invitationCodes)
  console.log('!! ! !   !Current invitation codes', invitationCodes)
  let peerList: string[] = []

  if (invitationCodes) {
    peerList = pairsToP2pAddresses(invitationCodes)
  } else {
    peerList = yield* select(connectionSelectors.peerList)
  }

  const payload: InitCommunityPayload = {
    id: identity.id,
    peerId: identity.peerId,
    hiddenService: identity.hiddenService,
    peers: peerList,
    psk: community.psk,
    ownerOrbitDbIdentity: community.ownerOrbitDbIdentity,
    inviteData: community.inviteData,
  }

  yield* apply(socket, socket.emitWithAck, applyEmitParams(SocketActionTypes.LAUNCH_COMMUNITY, payload))
}
