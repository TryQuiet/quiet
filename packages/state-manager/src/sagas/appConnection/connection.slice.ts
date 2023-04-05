import { createSlice, EntityState, PayloadAction } from '@reduxjs/toolkit'
import { StoreKeys } from '../store.keys'
import { NetworkDataPayload, NetworkStats, ConnectionProcessInfo } from './connection.types'
import { peersStatsAdapter } from './connection.adapter'

export class ConnectionState {
  public lastConnectedTime: number = 0
  public uptime: number = 0
  public peersStats: EntityState<NetworkStats> = peersStatsAdapter.getInitialState()
  public torBootstrapProcess: string = 'Bootstrapped 0% (starting)'
  public torConnectionProcess: { number: number; text: string } = {
    number: 5,
    text: 'Connecting process started'
  }
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
    },
    setTorBootstrapProcess: (state, action: PayloadAction<string>) => {
      const info = action.payload
      if (info.includes('Bootstrapped')) {
        const firstChar = info.indexOf(']') + 1
        const lastChar = info.indexOf(')') + 1
        const formattedInfo = info.slice(firstChar, lastChar).trim()
        state.torBootstrapProcess = formattedInfo
      }
    },
    setTorConnectionProcess: (state, action: PayloadAction<string>) => {
      const info = action.payload
      switch (info) {
        case ConnectionProcessInfo.FETCHING:
          state.torConnectionProcess = { number: 20, text: info }
          break
        case ConnectionProcessInfo.REGISTERING_USER_CERTIFICATE:
          state.torConnectionProcess = { number: 20, text: info }
          break
        case ConnectionProcessInfo.REGISTERING_OWNER_CERTIFICATE:
          state.torConnectionProcess = { number: 20, text: info }
          break
        case ConnectionProcessInfo.LAUNCHING_COMMUNITY:
          state.torConnectionProcess = { number: 30, text: info }
          break
        case ConnectionProcessInfo.SPAWNING_HIDDEN_SERVICE:
          state.torConnectionProcess = { number: 40, text: info }
          break
        case ConnectionProcessInfo.INITIALIZING_STORAGE:
          state.torConnectionProcess = { number: 50, text: info }
          break
        case ConnectionProcessInfo.INITIALIZING_LIBP2P:
          state.torConnectionProcess = { number: 60, text: info }
          break
        case ConnectionProcessInfo.INITIALIZING_IPFS:
          state.torConnectionProcess = { number: 65, text: info }
          break
        case ConnectionProcessInfo.INITIALIZED_STORAGE:
          state.torConnectionProcess = { number: 70, text: info }
          break
        case ConnectionProcessInfo.LOADED_CERTIFICATES:
          state.torConnectionProcess = { number: 75, text: info }
          break
        case ConnectionProcessInfo.INITIALIZED_DBS:
          state.torConnectionProcess = { number: 80, text: info }
          break
        case ConnectionProcessInfo.LAUNCHED_COMMUNITY:
          state.torConnectionProcess = { number: 85, text: info }
          break
        case ConnectionProcessInfo.CHANNELS_REPLICATED:
          state.torConnectionProcess = { number: 90, text: info }
          break
        case ConnectionProcessInfo.CERTIFICATES_REPLICATED:
          state.torConnectionProcess = { number: 95, text: info }
          break
      }
    }
  }
})

export const connectionActions = connectionSlice.actions
export const connectionReducer = connectionSlice.reducer
