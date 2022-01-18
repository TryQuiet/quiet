import { StoreKeys } from '../store.keys'
import { createSelector } from 'reselect'
import { CreatedSelectors, StoreState } from '../store.types'
import { certificatesMapping } from '../users/users.selectors'
import { selectedPeersAdapter } from './connection.adapter'

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

export const connectedPeers = createSelector(
  connectionSlice,
  (reducerState) => {
    return selectedPeersAdapter.getSelectors().selectAll(reducerState.connectedPeers)
  }
)

export const connectedPeersMapping = createSelector(
  certificatesMapping,
  connectedPeers,
  (certificates, peers) => {
    const usersData = Object.values(certificates)

    const usersDataPerPeerId = peers.reduce((accumulator, currentValue) => {
      for (const user of usersData) {
        if (currentValue === user.peerId) {
          return {
            ...accumulator,
            [currentValue]: user
          }
        }
      }
    }, {})

    return usersDataPerPeerId
  }
)

export const connectionSelectors = {
  initializedCommunities,
  initializedRegistrars,
  connectedPeers,
  connectedPeersMapping
}
