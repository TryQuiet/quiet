import { createSlice, EntityState, PayloadAction } from '@reduxjs/toolkit'
import { StoreKeys } from '../store.keys'
import { NetworkDataPayload } from './connection.types'
import { peersStatsAdapter } from './connection.adapter'

export interface NetworkStats {
  peerId: string
  lastSeen: number
  connectionTime: number
}

export class ConnectionState {
  public lastConnectedTime: number = 0
  public uptime: number = 0
  public peersStats: EntityState<NetworkStats> = peersStatsAdapter.getInitialState()
}

export const connectionSlice = createSlice({
  initialState: { ...new ConnectionState() },
  name: StoreKeys.Connection,
  reducers: {
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
