import { createSelector } from 'reselect'
import { StoreKeys } from '../store.keys'
import { type CreatedSelectors, type StoreState } from '../store.types'
import { connectedPeersAdapter } from './network.adapter'
import { currentCommunity } from '../communities/communities.selectors'

const networkSlice: CreatedSelectors[StoreKeys.Network] = (state: StoreState) => state[StoreKeys.Network]

export const loadingPanelType = createSelector(networkSlice, reducerState => reducerState.loadingPanelType)

export const initializedCommunities = createSelector(networkSlice, reducerState => reducerState.initializedCommunities)

export const isCurrentCommunityInitialized = createSelector(
  initializedCommunities,
  currentCommunity,
  (initializedCommunities, currentCommunity) => currentCommunity && initializedCommunities[currentCommunity.id]
)

export const connectedPeers = createSelector(networkSlice, reducerState => {
  return connectedPeersAdapter.getSelectors().selectAll(reducerState.connectedPeers)
})

export const communitiesLastConnectedAt = createSelector(networkSlice, reducerState => {
  return reducerState.communitiesLastConnectedAt
})

export const communityLastConnectedAt = createSelector(
  communitiesLastConnectedAt, 
  currentCommunity,
  (communitiesLastConnectedAt, currentCommunity) => {
    return currentCommunity ? communitiesLastConnectedAt[currentCommunity.id] : 0
  }
)

export const networkSelectors = {
  initializedCommunities,
  isCurrentCommunityInitialized,
  connectedPeers,
  loadingPanelType,
  communitiesLastConnectedAt,
  communityLastConnectedAt
}
