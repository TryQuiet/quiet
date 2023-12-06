import { apply, select, put, call } from 'typed-redux-saga'
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

export function* initCommunities(): Generator {
  const joined = yield* select(identitySelectors.joinedCommunities)

  if (!joined) {
    console.error('Did not join the community')
    return
  }

  const initializedCommunities = yield* select(networkSelectors.initializedCommunities)

  if (!initializedCommunities[joined]) {
    yield* put(communitiesActions.launchCommunity(joined))
  }``

  const currentTime = yield* call(getCurrentTime)
  yield* put(connectionActions.setLastConnectedTime(currentTime))
}

export function* launchCommunitySaga(
  socket: Socket
): Generator {
  const identity = yield* select(identitySelectors.currentIdentity)

  if (!identity?.userCsr?.userKey) {
    console.error('Could not launch community, No identity private key')
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
  }

  yield* apply(socket, socket.emit, applyEmitParams(SocketActionTypes.LAUNCH_COMMUNITY, payload))
}
