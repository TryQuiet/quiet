import { createSelector } from 'reselect'
import { StoreKeys } from '../store.keys'
import { type CreatedSelectors, type StoreState } from '../store.types'
import { connectedPeersAdapter } from './network.adapter'
import { currentCommunity } from '../communities/communities.selectors'
import { createLogger } from '../../utils/logger'

const logger = createLogger('networkSelectors')

const networkSlice: CreatedSelectors[StoreKeys.Network] = (state: StoreState) => state[StoreKeys.Network]

export const loadingPanelType = createSelector(networkSlice, reducerState => reducerState.loadingPanelType)

export const initializedCommunities = createSelector(networkSlice, reducerState => reducerState.initializedCommunities)

export const isCurrentCommunityInitialized = createSelector(
  [initializedCommunities, currentCommunity],
  (initialized, current) => {
    if (!current?.id) {
      logger.warn('Current community is not set or has no ID')
      return false
    }

    const isInitialized = !!initialized?.[current.id]
    return isInitialized
  }
)

export const connectedPeers = createSelector(networkSlice, reducerState => {
  return connectedPeersAdapter.getSelectors().selectAll(reducerState.connectedPeers)
})

export const networkSelectors = {
  initializedCommunities,
  isCurrentCommunityInitialized,
  connectedPeers,
  loadingPanelType,
}
