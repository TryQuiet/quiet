import { StoreKeys } from '../store.keys'
import { createSelector } from 'reselect'
import { type CreatedSelectors, type StoreState } from '../store.types'
import { allUsers, areCertificatesLoaded } from '../users/users.selectors'
import { peersStatsAdapter } from './connection.adapter'
import { connectedPeers, isCurrentCommunityInitialized } from '../network/network.selectors'
import { type NetworkStats } from './connection.types'
import { type User } from '../users/users.types'
import { filterAndSortPeers, invitationShareUrl } from '@quiet/common'
import { areMessagesLoaded, areChannelsLoaded } from '../publicChannels/publicChannels.selectors'
import { identitySelectors } from '../identity/identity.selectors'
import { communitiesSelectors } from '../communities/communities.selectors'

const connectionSlice: CreatedSelectors[StoreKeys.Connection] = (state: StoreState) => state[StoreKeys.Connection]

export const lastConnectedTime = createSelector(connectionSlice, reducerState => reducerState.lastConnectedTime)

export const torBootstrapProcess = createSelector(connectionSlice, reducerState => reducerState.torBootstrapProcess)

export const isTorInitialized = createSelector(connectionSlice, reducerState => reducerState.isTorInitialized)

export const connectionProcess = createSelector(connectionSlice, reducerState => reducerState.connectionProcess)

export const socketIOSecret = createSelector(connectionSlice, reducerState => reducerState.socketIOSecret)

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
  connectionSlice,
  communitiesSelectors.currentCommunity,
  identitySelectors.currentPeerAddress,
  (reducerState, community, localPeerAddress) => {
    if (!community) return []
    const arr = [...(community.peerList || [])]

    let stats: NetworkStats[]
    if (reducerState.peersStats === undefined) {
      stats = []
    } else {
      stats = peersStatsAdapter.getSelectors().selectAll(reducerState.peersStats)
    }
    console.log({ stats })

    return filterAndSortPeers(arr, stats, localPeerAddress)
  }
)

export const invitationUrl = createSelector(
  communitiesSelectors.psk,
  communitiesSelectors.ownerOrbitDbIdentity,
  peerList,
  (communityPsk, ownerOrbitDbIdentity, sortedPeerList) => {
    if (!sortedPeerList || sortedPeerList?.length === 0) return ''
    if (!communityPsk) return ''
    if (!ownerOrbitDbIdentity) return ''
    console.log('peerList ->>>', sortedPeerList)
    const initialPeers = sortedPeerList.slice(0, 3)
    return invitationShareUrl(initialPeers, communityPsk, ownerOrbitDbIdentity)
  }
)

export const connectedPeersMapping = createSelector(allUsers, connectedPeers, (certificates, peers) => {
  const usersData = Object.values(certificates)
  return peers.reduce((peersMapping: Record<string, User>, peerId: string) => {
    for (const user of usersData) {
      if (peerId === user.peerId) {
        return {
          ...peersMapping,
          [peerId]: user,
        }
      }
    }
    return peersMapping
  }, {})
})

export const isJoiningCompleted = createSelector(
  isCurrentCommunityInitialized,
  areMessagesLoaded,
  areChannelsLoaded,
  areCertificatesLoaded,
  (isCommunity, areMessages, areChannels, areCertificates) => {
    console.log({ isCommunity, areMessages, areChannels, areCertificates })
    return isCommunity && areMessages && areChannels && areCertificates
  }
)

export const connectionSelectors = {
  lastConnectedTime,
  connectedPeersMapping,
  peerList,
  invitationUrl,
  torBootstrapProcess,
  connectionProcess,
  isTorInitialized,
  socketIOSecret,
  isJoiningCompleted,
}
