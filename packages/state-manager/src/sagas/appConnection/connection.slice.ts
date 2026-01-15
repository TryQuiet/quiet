import { createSlice, type EntityState, type PayloadAction } from '@reduxjs/toolkit'
import { StoreKeys } from '../store.keys'
import { peersStatsAdapter } from './connection.adapter'
import {
  ConnectionProcessInfo,
  SetConnectionProcessInfoPayload,
  type NetworkDataPayload,
  type NetworkStats,
  InviteResultWithSalt,
} from '@quiet/types'
import { InviteResult } from '@localfirst/auth'
import { createLogger } from '../../utils/logger'

const logger = createLogger('connectionSlice')

export class ConnectionState {
  public lastConnectedTime = 0
  public uptime = 0
  public peersStats: EntityState<NetworkStats> = peersStatsAdapter.getInitialState()
  public isTorInitialized = false
  public socketIOSecret: string | null = null
  public torBootstrapProcess = 'Bootstrapped 0% (starting)'
  public connectionProcess: { number: number; text: ConnectionProcessInfo } = {
    number: 5,
    text: ConnectionProcessInfo.CONNECTION_STARTED,
  }
  public longLivedInvite: InviteResultWithSalt | undefined = undefined
  public p2pEnabled: boolean = true
}

export const connectionSlice = createSlice({
  initialState: { ...new ConnectionState() },
  name: StoreKeys.Connection,
  reducers: {
    updateUptime: (state, action) => {
      state.uptime = state.uptime + action.payload
    },
    setNetworkData: (state, action: PayloadAction<NetworkDataPayload>) => {
      const _peerStats = state.peersStats || peersStatsAdapter.getInitialState()
      peersStatsAdapter.upsertOne(_peerStats, {
        peerId: action.payload.peer,
        address: action.payload.address,
        lastSeen: action.payload.lastSeen,
        connectionTime: 0,
      })
    },
    updateNetworkData: (state, action: PayloadAction<NetworkDataPayload>) => {
      const prev = state.peersStats?.entities[action.payload.peer]?.connectionTime || 0
      const _peerStats = state.peersStats || peersStatsAdapter.getInitialState()
      peersStatsAdapter.upsertOne(_peerStats, {
        peerId: action.payload.peer,
        address: action.payload.address,
        lastSeen: action.payload.lastSeen,
        connectionTime: prev + action.payload.connectionDuration,
      })
    },
    setLastConnectedTime: (state, action: PayloadAction<number>) => {
      state.lastConnectedTime = action.payload
    },
    setTorInitialized: state => {
      state.isTorInitialized = true
    },
    setLongLivedInvite: (state, action: PayloadAction<InviteResultWithSalt | undefined>) => {
      state.longLivedInvite = action.payload
    },
    setSocketIOSecret: (state, action: PayloadAction<string>) => {
      state.socketIOSecret = action.payload
    },
    onConnectionProcessInfo: (state, _action: PayloadAction<string>) => state,
    setConnectionProcess: (state, action: PayloadAction<SetConnectionProcessInfoPayload>) => {
      const { info, isOwner } = action.payload
      logger.info('setConnectionProcess', info, isOwner)
      if (info == ConnectionProcessInfo.INITIALIZING_IPFS) {
        if (state.connectionProcess.number > 30) return
        logger.info(`Setting connection process to 30`)
        state.connectionProcess = { number: 30, text: ConnectionProcessInfo.BACKEND_MODULES }
      } else if (!isOwner) {
        if (info == ConnectionProcessInfo.CONNECTING_TO_COMMUNITY) {
          if (state.connectionProcess.number == 50) return
          logger.info(`Setting connection process to 50`)
          state.connectionProcess = { number: 50, text: ConnectionProcessInfo.CONNECTING_TO_COMMUNITY }
        } else if (info == ConnectionProcessInfo.CHANNELS_STORED) {
          let number = 90
          if (state.connectionProcess.number == 90) number = 95
          logger.info(`Setting connection process to ${number}`)
          state.connectionProcess = { number, text: ConnectionProcessInfo.LOADING_MESSAGES }
        }
      }
    },
    createInvite: (state, _action: PayloadAction<any>) => state,
    toggleP2P: state => state,
    setP2PEnabled: (state, action: PayloadAction<boolean>) => {
      state.p2pEnabled = action.payload
    },
  },
})

export const connectionActions = connectionSlice.actions
export const connectionReducer = connectionSlice.reducer
