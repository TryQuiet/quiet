import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import { StoreKeys } from '../store.keys'

export class PushNotificationsState {}

export const pushNotificationsSlice = createSlice({
  initialState: { ...new PushNotificationsState() },
  name: StoreKeys.PushNotifications,
  reducers: {
    sendDeviceTokenToBackend: (
      state,
      _action: PayloadAction<{
        deviceToken: string
        bundleId: string
        platform: 'ios' | 'android'
      }>
    ) => state,
  },
})

export const pushNotificationsActions = pushNotificationsSlice.actions
export const pushNotificationsReducer = pushNotificationsSlice.reducer
