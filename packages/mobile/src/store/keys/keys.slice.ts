import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import { StoreKeys } from '../store.keys'
import { DeviceCredentialsUpdatedEvent, KeysUpdatedEvent } from '@quiet/types'
import { createLogger } from '../../utils/logger'

const logger = createLogger('keysSlice')

export class KeysState {}

export const keysSlice = createSlice({
  initialState: { ...new KeysState() },
  name: StoreKeys.Keys,
  reducers: {
    saveKeysInKeychain: (state, _action: PayloadAction<KeysUpdatedEvent>) => state,
    saveDeviceCredentials: (state, _action: PayloadAction<DeviceCredentialsUpdatedEvent>) => state,
  },
})

export const keysActions = keysSlice.actions
export const keysReducer = keysSlice.reducer
