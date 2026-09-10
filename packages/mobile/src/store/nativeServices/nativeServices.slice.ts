import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { StoreKeys } from '../store.keys'
import type { FlushPersistorPayload } from './flushPersistor/flushPersistor.types'

export class NativeServicesState {
  shouldClearReduxStore: boolean = false
}

export const nativeServicesSlice = createSlice({
  initialState: { ...new NativeServicesState() },
  name: StoreKeys.NativeServices,
  reducers: {
    leaveCommunity: state => {
      state.shouldClearReduxStore = true
    },
    flushPersistor: (state, _action: PayloadAction<FlushPersistorPayload>) => state,
    resetApp: state => state,
  },
})

export const nativeServicesActions = nativeServicesSlice.actions
export const nativeServicesReducer = nativeServicesSlice.reducer
