import { createSelector } from 'reselect'
import { StoreKeys } from '../store.keys'
import { CreatedSelectors, StoreState } from '../store.types'
import { connectedPeersAdapter } from './network.adapter'

const networkSlice: CreatedSelectors[StoreKeys.Network] = (
  state: StoreState
) => state[StoreKeys.Network]

export const initializedCommunities = createSelector(
  networkSlice,
  (reducerState) => reducerState.initializedCommunities
)

export const initializedRegistrars = createSelector(
  networkSlice,
  (reducerState) => reducerState.initializedRegistrars
)

export const connectedPeers = createSelector(
  networkSlice,
  (reducerState) => {
    return connectedPeersAdapter.getSelectors().selectAll(reducerState.connectedPeers)
  }
)

export const networkSelectors = {
  initializedCommunities,
  initializedRegistrars,
  connectedPeers
}
