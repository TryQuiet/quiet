import { createSlice, EntityState, PayloadAction } from '@reduxjs/toolkit'
import { CommunityId, ConnectedPeers, RegistrarId } from '../appConnection/connection.types'
import { StoreKeys } from '../store.keys'
import { connectedPeersAdapter } from './network.adapter'

export class NetworkState {
  public initializedCommunities: { [key: string]: boolean } = {}
  public initializedRegistrars: { [key: string]: boolean } = {}
  public connectedPeers: EntityState<string> = connectedPeersAdapter.getInitialState()
}

export const networkSlice = createSlice({
  initialState: { ...new NetworkState() },
  name: StoreKeys.Network,
  reducers: {
    addInitializedCommunity: (state, action: PayloadAction<CommunityId>) => {
      state.initializedCommunities = {
        ...state.initializedCommunities,
        [action.payload]: true
      }
    },
    addInitializedRegistrar: (state, action: PayloadAction<RegistrarId>) => {
      state.initializedRegistrars = {
        ...state.initializedRegistrars,
        [action.payload]: true
      }
    },
    removeInitializedCommunities: (state, _action: PayloadAction<CommunityId>) => {
      state.initializedCommunities = {}
    },
    removeInitializedRegistrars: (state, _action: PayloadAction<RegistrarId>) => {
      state.initializedRegistrars = {}
    },
    addConnectedPeers: (state, action: PayloadAction<ConnectedPeers>) => {
      connectedPeersAdapter.upsertMany(state.connectedPeers, action.payload)
    },
    removeConnectedPeer: (state, action) => {
      connectedPeersAdapter.removeOne(state.connectedPeers, action.payload)
    },
    pruneConnectedPeers: (state, _action: PayloadAction<CommunityId>) => {
      connectedPeersAdapter.removeAll(state.connectedPeers)
    },
  }
})

export const networkActions = networkSlice.actions
export const networkReducer = networkSlice.reducer
