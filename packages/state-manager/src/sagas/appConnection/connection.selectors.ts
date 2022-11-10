import { StoreKeys } from '../store.keys'
import { createSelector } from 'reselect'
import { CreatedSelectors, StoreState } from '../store.types'
import { certificatesMapping } from '../users/users.selectors'
import { communitiesSelectors } from '../communities/communities.selectors'
import { connectedPeersAdapter, peersStatsAdapter } from './connection.adapter'

const connectionSlice: CreatedSelectors[StoreKeys.Connection] = (
  state: StoreState
) => state[StoreKeys.Connection]

export const initializedCommunities = createSelector(
  connectionSlice,
  (reducerState) => reducerState.initializedCommunities
)

export const initializedRegistrars = createSelector(
  connectionSlice,
  (reducerState) => reducerState.initializedRegistrars
)

export const lastConnectedTime = createSelector(
  connectionSlice,
  (reducerState) => reducerState.lastConnectedTime
)

export const appRefresh = createSelector(
  connectionSlice,
  (reducerState) => reducerState.appRefresh
)

export const connectedPeers = createSelector(
  connectionSlice,
  (reducerState) => {
    return connectedPeersAdapter.getSelectors().selectAll(reducerState.connectedPeers)
  }
)

/**
This is the very simple algorithm for evaluating the most wanted peers.
1. It takes the peers stats list that contains statistics for every peer our node was ever connected to.
2. Two sorted arrays are created - one sorted by last seen and other by most uptime shared.
3. Arrays are merged taking one element from list one and one element from the second list. Duplicates are ommited
4. We end up with mix of last seen and most uptime descending array of peers, the it is enchanced to libp2p address.
 */

export const peerList = createSelector(
  connectionSlice,
  communitiesSelectors.currentCommunity,
  (reducerState, community) => {
    const arr = [...community.peerList]
    const stats = peersStatsAdapter.getSelectors().selectAll(reducerState.peersStats)
    const lastSeenSorted = [...stats].sort((a, b) => {
      return b.lastSeen - a.lastSeen
    })
    const mostUptimeSharedSorted = [...stats].sort((a, b) => {
      return b.connectionTime - a.connectionTime
    })

    const mostWantedPeers = []

    for (let i = 0; i < stats.length; i++) {
      const peerOne = lastSeenSorted[i]
      const peerTwo = mostUptimeSharedSorted[i]

      if (!mostWantedPeers.includes(peerOne)) {
        mostWantedPeers.push(peerOne)
      }

      if (!mostWantedPeers.includes(peerTwo)) {
        mostWantedPeers.push(peerTwo)
      }
    }

   const peerList = mostWantedPeers.map((peerId) => {
      return arr.find((peerAddress) => {
        const id = peerAddress.split('/')[7]
        if (id === peerId.peerId) {
          arr.splice(arr.indexOf(peerAddress), 1)
          return true
        }
      })
    })

    return peerList.concat(arr)
  }
)

export const connectedPeersMapping = createSelector(
  certificatesMapping,
  connectedPeers,
  (certificates, peers) => {
    const usersData = Object.values(certificates)

    return peers.reduce((peersMapping, peerId) => {
      for (const user of usersData) {
        if (peerId === user.peerId) {
          return {
            ...peersMapping,
            [peerId]: user
          }
        }
      }
    }, {})
  }
)

export const connectionSelectors = {
  initializedCommunities,
  initializedRegistrars,
  lastConnectedTime,
  connectedPeers,
  connectedPeersMapping,
  peerList,
  appRefresh
}
