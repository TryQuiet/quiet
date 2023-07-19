import { createSlice } from '@reduxjs/toolkit'
import { StoreKeys } from '../store.keys'

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
    flushPersistor: state => state,
    resetApp: state => state,
  },
})

export const nativeServicesActions = nativeServicesSlice.actions
export const nativeServicesReducer = nativeServicesSlice.reducer
