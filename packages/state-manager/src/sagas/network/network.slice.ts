import { createSlice, type EntityState, type PayloadAction } from '@reduxjs/toolkit'
import { StoreKeys } from '../store.keys'
import { connectedPeersAdapter } from './network.adapter'
import { type CommunityId, type ConnectedPeers, LoadingPanelType } from '@quiet/types'
import { LoggerModuleName, loggingHandler } from '../../utils/logger'

const LOGGER = loggingHandler.initLogger([LoggerModuleName.NETWORK, LoggerModuleName.SLICE])

export class NetworkState {
  public initializedCommunities: Record<string, boolean> = {}
  public connectedPeers: EntityState<string> = connectedPeersAdapter.getInitialState()
  public loadingPanelType: LoadingPanelType = LoadingPanelType.StartingApplication
}

export const networkSlice = createSlice({
  initialState: { ...new NetworkState() },
  name: StoreKeys.Network,
  reducers: {
    addInitializedCommunity: (state, action: PayloadAction<CommunityId>) => {
      LOGGER.info(`Hunting for heisenbug: adding initialized community with payload: ${JSON.stringify(action.payload)}`)
      state.initializedCommunities = {
        ...state.initializedCommunities,
        [action.payload]: true,
      }
    },
    removeInitializedCommunities: state => {
      LOGGER.info(`Removing all initialized commpunities`)
      state.initializedCommunities = {}
    },
    addConnectedPeers: (state, action: PayloadAction<ConnectedPeers>) => {
      LOGGER.info(`Adding peer(s) with payload: ${JSON.stringify(action.payload)}`)
      connectedPeersAdapter.upsertMany(state.connectedPeers, action.payload)
    },
    removeConnectedPeer: (state, action) => {
      LOGGER.info(`Removing peer with payload: ${JSON.stringify(action.payload)}`)
      connectedPeersAdapter.removeOne(state.connectedPeers, action.payload)
    },
    setLoadingPanelType: (state, action) => {
      state.loadingPanelType = action.payload
    },
  },
})

export const networkActions = networkSlice.actions
export const networkReducer = networkSlice.reducer
