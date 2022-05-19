import { StoreKeys } from '../store.keys'
import { createSelector } from 'reselect'
import { CreatedSelectors, StoreState } from '../store.types'
import { certificatesMapping } from '../users/users.selectors'
import { connectedPeersAdapter } from './connection.adapter'

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

export const connectedPeers = createSelector(
  connectionSlice,
  (reducerState) => {
    return connectedPeersAdapter.getSelectors().selectAll(reducerState.connectedPeers)
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
  connectedPeersMapping
}
