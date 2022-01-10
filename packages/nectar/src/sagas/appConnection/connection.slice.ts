import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { PeerId } from '../identity/identity.slice'
import { StoreKeys } from '../store.keys'
import { CommunityId, RegistrarId } from './connection.types'

export class ConnectionState {
  public initializedCommunities: CommunityId[] = []
  public initializedRegistrars: RegistrarId[] = []

  public connectedPeers: PeerId[] = []
}

export const connectionSlice = createSlice({
  initialState: { ...new ConnectionState() },
  name: StoreKeys.Connection,
  reducers: {
    addInitializedCommunity: (state, action: PayloadAction<CommunityId>) => {
      state.initializedCommunities = [
        ...state.initializedCommunities,
        action.payload
      ]
    },
    addInitializedRegistrar: (state, action: PayloadAction<RegistrarId>) => {
      state.initializedRegistrars = [
        ...state.initializedRegistrars,
        action.payload
      ]
    },
    addConnectedPeers: (state, action: PayloadAction<PeerId>) => {
      const isPeerSaved = state.connectedPeers.filter((peerId) => peerId === action.payload)
      if (!isPeerSaved.length) {
        state.connectedPeers = [
          ...state.connectedPeers,
          action.payload
        ]
      }
    },
    removeConnectedPeers: (state, action: PayloadAction<PeerId>) => {
      state.connectedPeers = [
        ...state.connectedPeers,
        action.payload
      ]
    },
  }
})

export const connectionActions = connectionSlice.actions
export const connectionReducer = connectionSlice.reducer
