import { createSlice, type EntityState, type PayloadAction } from '@reduxjs/toolkit'
import { StoreKeys } from '../store.keys'
import { peersStatsAdapter } from './connection.adapter'
import { ConnectionProcessInfo, type NetworkDataPayload, type NetworkStats } from '@quiet/types'

export class ConnectionState {
  public lastConnectedTime = 0
  public uptime = 0
  public peersStats: EntityState<NetworkStats> = peersStatsAdapter.getInitialState()
  public isTorInitialized = false
  public torBootstrapProcess = 'Bootstrapped 0% (starting)'
  public connectionProcess: { number: number; text: ConnectionProcessInfo } = {
    number: 5,
    text: ConnectionProcessInfo.CONNECTION_STARTED,
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
      const prev = state.peersStats?.entities[action.payload.peer]?.connectionTime || 0

      console.log('prev peerStats', state.peersStats)
      const _peerStats = state.peersStats || peersStatsAdapter.getInitialState()
      console.log('next peerStats', _peerStats)

      peersStatsAdapter.upsertOne(_peerStats, {
        peerId: action.payload.peer,
        lastSeen: action.payload.lastSeen,
        connectionTime: prev + action.payload.connectionDuration,
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
    torBootstrapped: (state, _action: PayloadAction<any>) => state,
    setTorInitialized: state => {
      state.isTorInitialized = true
    },
    setConnectionProcess: (state, action: PayloadAction<string>) => {
      const info = action.payload

      switch (info) {
        case ConnectionProcessInfo.REGISTERING_OWNER_CERTIFICATE:
          state.connectionProcess = { number: 30, text: ConnectionProcessInfo.REGISTERING_OWNER_CERTIFICATE }
          break
        case ConnectionProcessInfo.INITIALIZING_IPFS:
          if (state.connectionProcess.number > 30) break
          state.connectionProcess = { number: 30, text: ConnectionProcessInfo.BACKEND_MODULES }
          break
        case ConnectionProcessInfo.CONNECTING_TO_COMMUNITY:
          state.connectionProcess = { number: 50, text: ConnectionProcessInfo.CONNECTING_TO_COMMUNITY }
          break
        case ConnectionProcessInfo.CHANNELS_REPLICATED || ConnectionProcessInfo.CERTIFICATES_REPLICATED:
          let number = 90
          if (state.connectionProcess.number == 90) number = 95
          state.connectionProcess = { number, text: ConnectionProcessInfo.LOADING_MESSAGES }
          break
      }
    },
  },
})

export const connectionActions = connectionSlice.actions
export const connectionReducer = connectionSlice.reducer
