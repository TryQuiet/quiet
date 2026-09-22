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
import {
  InvitationData,
  InvitationDataVersion,
  InvitationKind,
  type DeviceInvitationData,
  type NetworkStats,
  type User,
  type InvitationAuthDataV5,
} from '@quiet/types'

const logger = createLogger('connectionSelectors')

const connectionSlice: CreatedSelectors[StoreKeys.Connection] = (state: StoreState) => state[StoreKeys.Connection]

export const lastConnectedTime = createSelector(connectionSlice, reducerState => reducerState.lastConnectedTime)

export const torBootstrapProcess = createSelector(connectionSlice, reducerState => reducerState.torBootstrapProcess)

export const isTorInitialized = createSelector(connectionSlice, reducerState => reducerState.isTorInitialized)

export const isQssConnected = createSelector(connectionSlice, reducerState => reducerState.isQssConnected)

export const connectionProcess = createSelector(connectionSlice, reducerState => reducerState.connectionProcess)

export const socketIOSecret = createSelector(connectionSlice, reducerState => reducerState.socketIOSecret)

export const p2pEnabled = createSelector(connectionSlice, reducerState => reducerState.p2pEnabled)

export const networkEndpoints = createSelector(connectionSlice, reducerState =>
  Object.values(reducerState.networkEndpoints ?? {})
)

/**
 * The set of user ids that have at least one device currently connected.
 *
 * A user is one identity across several devices, so presence is a property of the user, not of a
 * peer: any one of their endpoints being connected means the user is reachable. Before device
 * linking a profile carried a single `userData.peerId` and the two were the same thing; they no
 * longer are, and reading presence off one endpoint would show a user offline whenever they are
 * online on their other device.
 */
export const connectedUserIds = createSelector(networkEndpoints, connectedPeers, (endpoints, connected) => {
  const connectedPeerIds = new Set(connected)
  const userIds = new Set<string>()
  for (const endpoint of endpoints) {
    if (connectedPeerIds.has(endpoint.peerId)) {
      userIds.add(endpoint.userId)
    }
  }
  return userIds
})

/**
 * `connectedUserIds` as a predicate, for components that ask about one user at a time.
 */
export const isUserConnected = createSelector(
  connectedUserIds,
  userIds => (userId: string | undefined) => userId != null && userIds.has(userId)
)

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
  networkEndpoints,
  identitySelectors.currentPeerAddress,
  peerStats,
  connectedPeers,
  (endpoints, localPeerAddress, stats, connectedPeers) => {
    const arr = endpoints.map(endpoint => createLibp2pAddress(endpoint.onionAddress, endpoint.peerId))
    const filteredAndSortedPeers = filterAndSortPeers(arr, stats, localPeerAddress, true, connectedPeers)
    return filteredAndSortedPeers
  }
)

export const longLivedInvite = createSelector(connectionSlice, reducerState => {
  return reducerState.longLivedInvite
})

export const deviceLinkInvite = createSelector(connectionSlice, reducerState => {
  return reducerState.deviceLinkInvite
})

export const deviceLinkCreationFailed = createSelector(connectionSlice, reducerState => {
  return reducerState.deviceLinkCreationFailed
})

/** `undefined` until a getLinkedDevices read comes back; `[]` means no other device. */
export const linkedDevices = createSelector(connectionSlice, reducerState => {
  return reducerState.linkedDevices
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
    if (!currentCommunity.teamId) {
      logger.warn('Community is missing team ID')
    }
    const teamId = currentCommunity.teamId
    const initialPeers = sortedPeerList.slice(0, 3)
    const pairs = p2pAddressesToPairs(initialPeers)
    let inviteData: InvitationData = {
      psk: communityPsk,
      pairs,
      authData: {
        communityName: currentCommunity.name,
        seed: longLivedInvite.seed,
        teamId,
      },
      version: InvitationDataVersion.v4,
    }
    const qssEnabled = currentCommunity.qssEnabled
    const qssEndpoint = currentCommunity.qssEndpoint

    if (qssEnabled === true) {
      if (teamId == null || qssEndpoint == null) {
        const message = `QSS is enabled but team ID and/or QSS endpoint was null!  You must provide a team ID and QSS endpoint to properly handle QSS invites!`
        logger.error(message)
        throw new Error(message)
      }

      inviteData = {
        ...inviteData,
        authData: {
          ...inviteData.authData,
          salt: longLivedInvite.salt,
        } as InvitationAuthDataV5,
        version: InvitationDataVersion.v5,
        qssEnabled,
        qssEndpoint,
      }
    }
    return composeInvitationShareUrl(inviteData)
  }
)

const createDeviceLinkUrl = createSelector(
  communitiesSelectors.psk,
  communitiesSelectors.currentCommunity,
  peerList,
  deviceLinkInvite,
  (_state: StoreState, currentTime: number) => currentTime,
  (communityPsk, currentCommunity, sortedPeerList, deviceLinkInvite, currentTime) => {
    if (
      !sortedPeerList ||
      sortedPeerList.length === 0 ||
      !communityPsk ||
      !currentCommunity ||
      !deviceLinkInvite ||
      deviceLinkInvite.expiresAt <= currentTime
    ) {
      return ''
    }
    if (!currentCommunity.name || !currentCommunity.teamId) {
      logger.warn('Community is missing a name or team ID')
      return ''
    }

    const initialPeers = sortedPeerList.slice(0, 3)
    const pairs = p2pAddressesToPairs(initialPeers)
    const authData = {
      communityName: currentCommunity.name,
      seed: deviceLinkInvite.seed,
      teamId: currentCommunity.teamId,
      userId: deviceLinkInvite.userId,
      userName: deviceLinkInvite.userName,
    }

    let inviteData: DeviceInvitationData = {
      kind: InvitationKind.Device,
      psk: communityPsk,
      pairs,
      authData,
      version: InvitationDataVersion.v4,
    }

    if (currentCommunity.qssEnabled === true) {
      if (currentCommunity.qssEndpoint == null) {
        const message = `QSS is enabled but QSS endpoint was null! You must provide a QSS endpoint to generate a device link.`
        logger.error(message)
        throw new Error(message)
      }
      inviteData = {
        ...inviteData,
        version: InvitationDataVersion.v5,
        qssEnabled: true,
        qssEndpoint: currentCommunity.qssEndpoint,
      }
    }

    return composeInvitationShareUrl(inviteData)
  }
)

// Date is an explicit selector input so repeated reads cannot return a memoized,
// already-expired invitation when no socket or Redux event occurs at the boundary.
export const deviceLinkUrl = (state: StoreState): string => createDeviceLinkUrl(state, Date.now())

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
  deviceLinkInvite,
  deviceLinkCreationFailed,
  deviceLinkUrl,
  linkedDevices,
  torBootstrapProcess,
  connectionProcess,
  isTorInitialized,
  isQssConnected,
  socketIOSecret,
  isJoiningCompleted,
  peerStats,
  networkEndpoints,
  connectedUserIds,
  isUserConnected,
  p2pEnabled,
}
