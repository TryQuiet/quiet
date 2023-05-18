import { apply, select, put, call } from 'typed-redux-saga'
import { PayloadAction } from '@reduxjs/toolkit'
import { applyEmitParams, Socket } from '../../../types'
import { identitySelectors } from '../../identity/identity.selectors'
import { communitiesSelectors } from '../communities.selectors'
import { communitiesActions } from '../communities.slice'
import { connectionActions } from '../../appConnection/connection.slice'
import { getCurrentTime } from '../../messages/utils/message.utils'
import { connectionSelectors } from '../../appConnection/connection.selectors'
import { networkSelectors } from '../../network/network.selectors'
import { InitCommunityPayload, SocketActionTypes } from '@quiet/types'

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
  action: PayloadAction<ReturnType<typeof communitiesActions.launchCommunity>['payload'] | undefined>
): Generator {
  let communityId: string | undefined = action.payload

  if (!communityId) {
    communityId = yield* select(communitiesSelectors.currentCommunityId)
  }

  const community = yield* select(communitiesSelectors.selectById(communityId))
  const identity = yield* select(identitySelectors.selectById(communityId))
  if (!community || !identity || !identity.userCertificate || !identity.userCsr?.userKey || !community.rootCa) {
    console.error('Could not launch community, Community or Identity is lacking data')
    return
  }

  const peerList = yield* select(connectionSelectors.peerList)

  const payload: InitCommunityPayload = {
    id: identity.id,
    peerId: identity.peerId,
    hiddenService: identity.hiddenService,
    certs: {
      certificate: identity.userCertificate,
      key: identity.userCsr.userKey,
      CA: [community.rootCa]
    },
    peers: peerList
  }

  yield* apply(socket, socket.emit, applyEmitParams(SocketActionTypes.LAUNCH_COMMUNITY, payload))
}
