import { createSlice, type EntityState, type PayloadAction } from '@reduxjs/toolkit'
import { StoreKeys } from '../store.keys'
import { connectedPeersAdapter } from './network.adapter'
import { type CommunityId, type ConnectedPeers, LoadingPanelType, ClearConnectedPeersPayload } from '@quiet/types'

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
      state.initializedCommunities = {
        ...state.initializedCommunities,
        [action.payload]: true,
      }
    },
    removeInitializedCommunities: state => {
      state.initializedCommunities = {}
    },
    addConnectedPeers: (state, action: PayloadAction<ConnectedPeers>) => {
      connectedPeersAdapter.addMany(state.connectedPeers, action.payload)
    },
    removeConnectedPeer: (state, action: PayloadAction<ConnectedPeers>) => {
      connectedPeersAdapter.removeOne(state.connectedPeers, action.payload[0])
    },
    clearConnectedPeers: (state, action: PayloadAction<ClearConnectedPeersPayload>) => {
      connectedPeersAdapter.removeAll(state.connectedPeers)
    },
    setLoadingPanelType: (state, action) => {
      state.loadingPanelType = action.payload
    },
  },
})

export const networkActions = networkSlice.actions
export const networkReducer = networkSlice.reducer
