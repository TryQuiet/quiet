import { createSlice, type EntityState, type PayloadAction } from '@reduxjs/toolkit'
import { StoreKeys } from '../store.keys'
import { connectedPeersAdapter } from './network.adapter'
import { type CommunityId, type ConnectedPeers, LoadingPanelType } from '@quiet/types'
import { DateTime } from 'luxon'

export class NetworkState {
  public initializedCommunities: Record<string, boolean> = {}
  public connectedPeers: EntityState<string> = connectedPeersAdapter.getInitialState()
  public loadingPanelType: LoadingPanelType = LoadingPanelType.StartingApplication
  public communitiesLastConnectedAt: Record<string, number> = {}
  public allPeersDisconnectedAt: number | undefined = undefined
}

export const networkSlice = createSlice({
  initialState: { ...new NetworkState() },
  name: StoreKeys.Network,
  reducers: {
    addInitializedCommunity: (state, action: PayloadAction<CommunityId>) => {
      console.log('Hunting for heisenbug: adding initialized community ', action.payload)
      state.initializedCommunities = {
        ...state.initializedCommunities,
        [action.payload]: true,
      }
      state.communitiesLastConnectedAt[action.payload] = DateTime.utc().toSeconds()
    },
    removeInitializedCommunities: state => {
      state.initializedCommunities = {}
    },
    addConnectedPeers: (state, action: PayloadAction<ConnectedPeers>) => {
      if (state.allPeersDisconnectedAt != null) {
        state.allPeersDisconnectedAt = undefined
      }
      connectedPeersAdapter.upsertMany(state.connectedPeers, action.payload)
    },
    removeConnectedPeer: (state, action) => {
      connectedPeersAdapter.removeOne(state.connectedPeers, action.payload)
      const currentPeers = connectedPeersAdapter.getSelectors().selectAll(state.connectedPeers)
      if (currentPeers.length === 0) {
        state.allPeersDisconnectedAt = DateTime.utc().toSeconds()
      }
    },
    setLoadingPanelType: (state, action) => {
      state.loadingPanelType = action.payload
    },
  },
})

export const networkActions = networkSlice.actions
export const networkReducer = networkSlice.reducer
