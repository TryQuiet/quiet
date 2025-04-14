import { StoreKeys } from '../store.keys'
import { createSelector } from 'reselect'
import { type CreatedSelectors, type StoreState } from '../store.types'
import { peersStatsAdapter } from './connection.adapter'
import { isCurrentCommunityInitialized } from '../network/network.selectors'
import { composeInvitationShareUrl, filterAndSortPeers, p2pAddressesToPairs } from '@quiet/common'
import { areMessagesLoaded, areChannelsLoaded } from '../publicChannels/publicChannels.selectors'
import { identitySelectors } from '../identity/identity.selectors'
import { communitiesSelectors } from '../communities/communities.selectors'
import { createLogger } from '../../utils/logger'
import { InvitationData, InvitationDataVersion, type NetworkStats, type User } from '@quiet/types'

const logger = createLogger('connectionSelectors')

const connectionSlice: CreatedSelectors[StoreKeys.Connection] = (state: StoreState) => state[StoreKeys.Connection]

export const lastConnectedTime = createSelector(connectionSlice, reducerState => reducerState.lastConnectedTime)

export const torBootstrapProcess = createSelector(connectionSlice, reducerState => reducerState.torBootstrapProcess)

export const isTorInitialized = createSelector(connectionSlice, reducerState => reducerState.isTorInitialized)

export const connectionProcess = createSelector(connectionSlice, reducerState => reducerState.connectionProcess)

export const socketIOSecret = createSelector(connectionSlice, reducerState => reducerState.socketIOSecret)

const peerStats = createSelector(connectionSlice, reducerState => {
  let stats: NetworkStats[]
  if (reducerState.peersStats === undefined) {
    stats = []
  } else {
    stats = peersStatsAdapter.getSelectors().selectAll(reducerState.peersStats)
  }
  return stats
})

export const peerList = createSelector(
  communitiesSelectors.currentCommunity,
  identitySelectors.currentPeerAddress,
  peerStats,
  (community, localPeerAddress, stats) => {
    if (!community) return []

    const arr = [...(community.peerList || [])]
    return filterAndSortPeers(arr, stats, localPeerAddress)
  }
)

export const longLivedInvite = createSelector(connectionSlice, reducerState => {
  return reducerState.longLivedInvite
})

export const invitationUrl = createSelector(
  communitiesSelectors.psk,
  communitiesSelectors.currentCommunity,
  peerList,
  longLivedInvite,
  (communityPsk, currentCommunity, sortedPeerList, longLivedInvite) => {
    if (!sortedPeerList || sortedPeerList?.length === 0) return ''
    if (!communityPsk) return ''
    if (!longLivedInvite) return ''
    if (!currentCommunity) return ''
    if (!currentCommunity.name) return ''
    const initialPeers = sortedPeerList.slice(0, 3)
    const pairs = p2pAddressesToPairs(initialPeers)
    const inviteData: InvitationData = {
      psk: communityPsk,
      pairs,
      version: InvitationDataVersion.v2,
      authData: {
        communityName: currentCommunity.name,
        seed: longLivedInvite.seed,
      },
    }
    return composeInvitationShareUrl(inviteData)
  }
)

export const isJoiningCompleted = createSelector(
  isCurrentCommunityInitialized,
  areMessagesLoaded,
  areChannelsLoaded,
  (isCommunity, areMessages, areChannels) => {
    logger.info('isJoiningCompleted', { isCommunity, areMessages, areChannels })
    return !!(isCommunity && areChannels && areMessages)
  }
)

export const connectionSelectors = {
  lastConnectedTime,
  peerList,
  invitationUrl,
  longLivedInvite,
  torBootstrapProcess,
  connectionProcess,
  isTorInitialized,
  socketIOSecret,
  isJoiningCompleted,
}
