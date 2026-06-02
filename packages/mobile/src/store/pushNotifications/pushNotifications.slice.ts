import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { StoreKeys } from '../store.keys'
import { NotificationPermissionStatus } from './pushNotifications.types'

export class PushNotificationsState {
  permissionStatus: NotificationPermissionStatus = NotificationPermissionStatus.NotDetermined
  permissionRequested: boolean = false
  backgroundTorEnabled = false
}

export const pushNotificationsSlice = createSlice({
  initialState: { ...new PushNotificationsState() },
  name: StoreKeys.PushNotifications,
  reducers: {
    requestPermission: state => state,
    setPermissionStatus: (state, action: PayloadAction<NotificationPermissionStatus>) => {
      state.permissionStatus = action.payload
      state.permissionRequested = true
    },
    checkPermissionOnLaunch: state => state,
    setBackgroundTorEnabled: (state, action: PayloadAction<boolean>) => {
      state.backgroundTorEnabled = action.payload
    },
  },
})

export const pushNotificationsActions = pushNotificationsSlice.actions
export const pushNotificationsReducer = pushNotificationsSlice.reducer
