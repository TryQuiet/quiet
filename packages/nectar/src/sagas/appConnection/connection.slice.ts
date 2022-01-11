import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { ConnectedPeersSet } from '../socket/const/actionTypes'
import { StoreKeys } from '../store.keys'
import { CommunityId, RegistrarId } from './connection.types'

export class ConnectionState {
  public initializedCommunities: { [key: string]: boolean } = {}
  public initializedRegistrars: { [key: string]: boolean } = {}

  public connectedPeers: string[] = []
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
    addConnectedPeers: (state, action: PayloadAction<ConnectedPeersSet>) => {
      let connectedPeers = Array.from(action.payload.connectedPeers)
      const isConnectedPeerSaved = connectedPeers.filter((item) => item === action.payload.newPeer)
      if (!isConnectedPeerSaved.length) {
        connectedPeers.push(action.payload.newPeer)
      }

      state.connectedPeers = connectedPeers
    },
    removeConnectedPeers: (state, action: PayloadAction<ConnectedPeersSet>) => {
      const connectedPeers = Array.from(action.payload.connectedPeers)
      const connectedPeersSaved = connectedPeers.map((item) => {
        if (!(item === action.payload.newPeer)) {
          return item
        }
      })

      state.connectedPeers = connectedPeersSaved
    },
  }
})

export const connectionActions = connectionSlice.actions
export const connectionReducer = connectionSlice.reducer
