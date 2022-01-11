import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { StoreKeys } from '../store.keys'
import { CommunityId, RegistrarId } from './connection.types'

export class ConnectionState {
  public initializedCommunities: { [key: string]: boolean } = {}
  public initializedRegistrars: { [key: string]: boolean } = {}
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
    }
  }
})

export const connectionActions = connectionSlice.actions
export const connectionReducer = connectionSlice.reducer
