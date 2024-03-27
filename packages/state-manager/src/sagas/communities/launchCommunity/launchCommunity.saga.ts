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
import { type InitCommunityPayload, SocketActionTypes } from '@quiet/types'
import createLogger from '../../../utils/logger'

const logger = createLogger('communities')

// TODO: Remove if unused
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
  const communityId = action.payload
  const community = yield* select(communitiesSelectors.selectById(communityId))
  const identity = yield* select(identitySelectors.selectById(communityId))

  if (!identity?.userCsr?.userKey) {
    logger.error('Could not launch community, No identity private key')
    return
  }

  const invitationCodes = yield* select(communitiesSelectors.invitationCodes)
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
    psk: community?.psk,
    ownerOrbitDbIdentity: community?.ownerOrbitDbIdentity,
  }

  yield* apply(socket, socket.emit, applyEmitParams(SocketActionTypes.LAUNCH_COMMUNITY, payload))
}
