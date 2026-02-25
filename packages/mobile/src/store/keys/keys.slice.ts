import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import { StoreKeys } from '../store.keys'
import { KeysUpdatedEvent, KeyWithMetadata } from '@quiet/types'
import { createLogger } from '../../utils/logger'

const logger = createLogger('keysSlice')

export class KeysState {
  public secretKeys: KeyWithMetadata[] = []
  public userPublicKeys: KeyWithMetadata[] = []
  public sigKeys: KeyWithMetadata[] = []
}

export const keysSlice = createSlice({
  initialState: { ...new KeysState() },
  name: StoreKeys.Keys,
  reducers: {
    setKeys: (state, action: PayloadAction<KeysUpdatedEvent>) => {
      state.secretKeys = action.payload.secretKeys
      state.sigKeys = action.payload.sigKeys
      state.userPublicKeys = action.payload.userPublicKeys
    },
    saveKeysInKeychain: (state, _action: PayloadAction<KeysUpdatedEvent>) => state,
  },
})

export const keysActions = keysSlice.actions
export const keysReducer = keysSlice.reducer
