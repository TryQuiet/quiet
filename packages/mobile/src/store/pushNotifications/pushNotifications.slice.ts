import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { StoreKeys } from '../store.keys'
import { NotificationPermissionStatus, PushNotificationState } from './pushNotifications.types'

export class PushNotificationsState implements PushNotificationState {
  permissionStatus: NotificationPermissionStatus = NotificationPermissionStatus.NotDetermined
  permissionRequested: boolean = false
  deviceToken: string | null = null
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
    setDeviceToken: (state, action: PayloadAction<string>) => {
      state.deviceToken = action.payload
    },
    checkPermissionOnLaunch: state => state,
  },
})

export const pushNotificationsActions = pushNotificationsSlice.actions
export const pushNotificationsReducer = pushNotificationsSlice.reducer
