import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import logger from '../../utils/logger'
import { ConnectedPeersSet } from '../socket/const/actionTypes'
import { StoreKeys } from '../store.keys'
import { CommunityId, RegistrarId } from './connection.types'

export class ConnectionState {
  public initializedCommunities: { [key: string]: boolean } = {}
  public initializedRegistrars: { [key: string]: boolean } = {}

  public connectedPeers: string[] = []
}

const log = logger('connectionSlice')

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
    addConnectedPeers: (state, action: PayloadAction<ConnectedPeersSet>) => {
      const connectedPeers = Array.from(action.payload.connectedPeers)
      const isConnectedPeerSaved = connectedPeers.filter((item) => item === action.payload.newPeer)
      if (!isConnectedPeerSaved.length) {
        connectedPeers.push(action.payload.newPeer)
      }
      log('ADD PEER', action.payload)
      state.connectedPeers = connectedPeers
    },
    removeConnectedPeers: (state, action: PayloadAction<ConnectedPeersSet>) => {
      const connectedPeers = Array.from(action.payload.connectedPeers)
      const connectedPeersSaved = connectedPeers.map((item) => {
        if (!(item === action.payload.newPeer)) {
          return item
        }
      })
      log('REMOVE PEER', action.payload)

      state.connectedPeers = connectedPeersSaved
    }
  }
})

export const connectionActions = connectionSlice.actions
export const connectionReducer = connectionSlice.reducer
