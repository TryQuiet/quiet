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
  public torConnectionProcess: { number: number; text: string } = {
    number: 5,
    text: 'Connecting process started',
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
    increaseLoadingProcess: state => state,
    increaseConnectionToCommunityStep: state => {
      let { number } = state.torConnectionProcess
      number++
      state.torConnectionProcess = { number, text: ConnectionProcessInfo.CONNECTING_TO_COMMUNITY }
    },
    setConnectionProcess: (state, action: PayloadAction<string>) => {
      const info = action.payload
      console.log({ info })
      switch (info) {
        case ConnectionProcessInfo.REGISTERING_OWNER_CERTIFICATE:
          state.torConnectionProcess = { number: 30, text: ConnectionProcessInfo.REGISTERING_OWNER_CERTIFICATE }
          break
        case ConnectionProcessInfo.INITIALIZING_IPFS:
          if (state.torConnectionProcess.number > 30) break
          state.torConnectionProcess = { number: 30, text: 'Initialized backend modules' }
          break
        case ConnectionProcessInfo.CONNECTING_TO_COMMUNITY:
          state.torConnectionProcess = { number: 40, text: ConnectionProcessInfo.CONNECTING_TO_COMMUNITY }
          break
        case ConnectionProcessInfo.CHANNELS_REPLICATED || ConnectionProcessInfo.CERTIFICATES_REPLICATED:
          let number = 90
          if (state.torConnectionProcess.number == 90) number = 95
          state.torConnectionProcess = { number, text: ConnectionProcessInfo.LOADING_MESSAGES }
          break
      }
    },
  },
})

export const connectionActions = connectionSlice.actions
export const connectionReducer = connectionSlice.reducer
