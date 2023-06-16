import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import { StoreKeys } from '../store.keys'
import { NotificationsOptions, NotificationsSounds } from './settings.types'

export class SettingsState {
  public notificationsOption: NotificationsOptions = NotificationsOptions.notifyForEveryMessage
  public notificationsSound: NotificationsSounds = NotificationsSounds.pow
}

export const settingsSlice = createSlice({
  initialState: { ...new SettingsState() },
  name: StoreKeys.Settings,
  reducers: {
    setNotificationsOption: (state, action: PayloadAction<NotificationsOptions>) => {
      state.notificationsOption = action.payload
    },
    setNotificationsSound: (state, action: PayloadAction<NotificationsSounds>) => {
      state.notificationsSound = action.payload
    }
  }
})

export const settingsActions = settingsSlice.actions
export const settingsReducer = settingsSlice.reducer
