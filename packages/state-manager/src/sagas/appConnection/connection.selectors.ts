import { createSelector } from 'reselect'
import { StoreKeys } from '../store.keys'
import { type CreatedSelectors, type StoreState } from '../store.types'
import { peersStatsAdapter } from './connection.adapter'
import { connectedPeers, isCurrentCommunityInitialized } from '../network/network.selectors'
import { composeInvitationShareUrl, createLibp2pAddress, filterAndSortPeers, p2pAddressesToPairs } from '@quiet/common'
import { areMessagesLoaded, areChannelsLoaded } from '../publicChannels/publicChannels.selectors'
import { identitySelectors } from '../identity/identity.selectors'
import { communitiesSelectors } from '../communities/communities.selectors'
import { createLogger } from '../../utils/logger'
import { InvitationData, InvitationDataVersion, type UserProfile, type NetworkStats, type User } from '@quiet/types'
import { userProfileSelectors } from '../users/userProfile/userProfile.selectors'

const logger = createLogger('connectionSelectors')

const connectionSlice: CreatedSelectors[StoreKeys.Connection] = (state: StoreState) => state[StoreKeys.Connection]

export const lastConnectedTime = createSelector(connectionSlice, reducerState => reducerState.lastConnectedTime)

export const torBootstrapProcess = createSelector(connectionSlice, reducerState => reducerState.torBootstrapProcess)

export const isTorInitialized = createSelector(connectionSlice, reducerState => reducerState.isTorInitialized)

export const connectionProcess = createSelector(connectionSlice, reducerState => reducerState.connectionProcess)

export const socketIOSecret = createSelector(connectionSlice, reducerState => reducerState.socketIOSecret)

export const p2pEnabled = createSelector(connectionSlice, reducerState => reducerState.p2pEnabled)

export const peerStats = createSelector(connectionSlice, reducerState => {
  let stats: NetworkStats[]
  if (reducerState.peersStats === undefined) {
    stats = []
  } else {
    stats = peersStatsAdapter.getSelectors().selectAll(reducerState.peersStats)
  }
  return stats
})

export const peerList = createSelector(
  userProfileSelectors.userProfiles,
  identitySelectors.currentPeerAddress,
  peerStats,
  connectedPeers,
  (userProfiles, localPeerAddress, stats, connectedPeers) => {
    let arr: string[] = []
    if (userProfiles) {
      const profiles = Object.values(userProfiles)
      arr = profiles
        .map((user: UserProfile) => {
          if (!user.userData) return null
          if (!user.userData.onionAddress) return null
          if (!user.userData.peerId) return null
          return createLibp2pAddress(user.userData.onionAddress, user.userData.peerId)
        })
        .filter((address): address is string => address !== null && address !== undefined)
    }
    const filteredAndSortedPeers = filterAndSortPeers(arr, stats, localPeerAddress, true, connectedPeers)
    return filteredAndSortedPeers
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
    if (!sortedPeerList || sortedPeerList?.length === 0) {
      return ''
    }
    if (!communityPsk) {
      return ''
    }
    if (!longLivedInvite) {
      return ''
    }
    if (!currentCommunity) {
      return ''
    }
    if (!currentCommunity.name) {
      return ''
    }
    const initialPeers = sortedPeerList.slice(0, 3)
    const pairs = p2pAddressesToPairs(initialPeers)
    let inviteData: InvitationData = {
      psk: communityPsk,
      pairs,
      authData: {
        communityName: currentCommunity.name,
        seed: longLivedInvite.seed,
        salt: longLivedInvite.salt,
      },
      version: InvitationDataVersion.v2,
    }
    const qssEnabled = currentCommunity.qssEnabled
    const teamId = currentCommunity.teamId
    const qssEndpoint = currentCommunity.qssEndpoint

    if (qssEnabled === true) {
      if (teamId == null || qssEndpoint == null) {
        const message = `QSS is enabled but team ID and/or QSS endpoint was null!  You must provide a team ID and QSS endpoint to properly handle QSS invites!`
        logger.error(message)
        throw new Error(message)
      }

      inviteData = {
        ...inviteData,
        version: InvitationDataVersion.v3,
        qssEnabled,
        qssEndpoint,
        authData: {
          ...inviteData.authData,
          teamId,
        },
      }
    }
    return composeInvitationShareUrl(inviteData)
  }
)

export const isJoiningCompleted = createSelector(
  isTorInitialized,
  isCurrentCommunityInitialized,
  areMessagesLoaded,
  areChannelsLoaded,
  (isTorInit, isCommunityInitialized, areMessages, areChannels) => {
    return !!(isCommunityInitialized && areChannels && areMessages)
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
  peerStats,
  p2pEnabled,
}
