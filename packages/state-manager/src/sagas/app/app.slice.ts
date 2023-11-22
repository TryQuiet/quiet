import { createSlice } from '@reduxjs/toolkit'
import { StoreKeys } from '../store.keys'

// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class AppState {}

export const appSlice = createSlice({
    initialState: { ...new AppState() },
    name: StoreKeys.App,
    reducers: {
        closeServices: state => state,
        stopBackend: state => state,
    },
})

export const appActions = appSlice.actions
export const appReducer = appSlice.reducer
