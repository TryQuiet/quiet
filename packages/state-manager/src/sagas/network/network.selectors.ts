import { createSelector } from 'reselect'
import { StoreKeys } from '../store.keys'
import { type CreatedSelectors, type StoreState } from '../store.types'
import { connectedPeersAdapter } from './network.adapter'
import { currentCommunity } from '../communities/communities.selectors'
import { LoggerModuleName, loggingHandler } from '../../utils/logger'

const LOGGER = loggingHandler.initLogger([LoggerModuleName.NETWORK, LoggerModuleName.SELECTORS])

const networkSlice: CreatedSelectors[StoreKeys.Network] = (state: StoreState) => state[StoreKeys.Network]

export const loadingPanelType = createSelector(networkSlice, reducerState => reducerState.loadingPanelType)

export const initializedCommunities = createSelector(networkSlice, reducerState => reducerState.initializedCommunities)

export const isCurrentCommunityInitialized = createSelector(
  initializedCommunities,
  currentCommunity,
  (initializedCommunities, currentCommunity) => currentCommunity && initializedCommunities[currentCommunity.id]
)

export const connectedPeers = createSelector(networkSlice, reducerState => {
  const allConnectedPeers = connectedPeersAdapter.getSelectors().selectAll(reducerState.connectedPeers)
  LOGGER.info(`All connected peers: ${JSON.stringify(allConnectedPeers)}`)
  return allConnectedPeers
})

export const networkSelectors = {
  initializedCommunities,
  isCurrentCommunityInitialized,
  connectedPeers,
  loadingPanelType,
}
