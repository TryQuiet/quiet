import { createSlice, EntityState, PayloadAction } from '@reduxjs/toolkit'
import { StoreKeys } from '../store.keys'
import { CommunityId, RegistrarId, NetworkDataPayload } from './connection.types'
import { connectedPeersAdapter, peersStatsAdapter } from './connection.adapter'
import { DateTime } from 'luxon'

export interface NetworkStats {
  peerId: string
  lastSeen: number
  connectionTime: number
}

export class ConnectionState {
  public initializedCommunities: { [key: string]: boolean } = {}
  public initializedRegistrars: { [key: string]: boolean } = {}
  public lastConnectedTime: number = 0
  public uptime: number = 0
  public connectedPeers: EntityState<string> = connectedPeersAdapter.getInitialState()
  public peersStats: EntityState<NetworkStats> = peersStatsAdapter.getInitialState()
}

export const connectionSlice = createSlice({
  initialState: { ...new ConnectionState() },
  name: StoreKeys.Connection,
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
    addConnectedPeer: (state, action) => {
      connectedPeersAdapter.upsertOne(state.connectedPeers, action.payload)
    },
    removeConnectedPeer: (state, action) => {
      connectedPeersAdapter.removeOne(state.connectedPeers, action.payload)
    },
    pruneConnectedPeers: (state, _action: PayloadAction<CommunityId>) => {
      connectedPeersAdapter.removeAll(state.connectedPeers)
    },
    updateUptime: (state, action) => {
      state.uptime = state.uptime + action.payload
    },
    updateNetworkData: (state, action: PayloadAction<NetworkDataPayload>) => {
      const prev = state.peersStats.entities[action.payload.peer]?.connectionTime || 0

      peersStatsAdapter.upsertOne(state.peersStats, {
        peerId: action.payload.peer,
        lastSeen: action.payload.lastSeen,
        connectionTime: prev + action.payload.connectionDuration
      })
    },
    setLastConnectedTime: (state, action: PayloadAction<number>) => {
      state.lastConnectedTime = action.payload
    }
  }
})

export const connectionActions = connectionSlice.actions
export const connectionReducer = connectionSlice.reducer
