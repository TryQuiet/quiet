import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import { DEFAULT_AUTODOWNLOAD_SIZE_LIMIT } from '../../constants'
import { StoreKeys } from '../store.keys'
import { NotificationsOptions, NotificationsSounds } from './settings.types'

export class SettingsState {
  public notificationsOption: NotificationsOptions = NotificationsOptions.notifyForEveryMessage
  public notificationsSound: NotificationsSounds = NotificationsSounds.pow
  public maxAutodownloadBytes: number = DEFAULT_AUTODOWNLOAD_SIZE_LIMIT // 20 MB
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
    },
    setMaxAutodownloadBytes: (state, action: PayloadAction<number>) => {
      state.maxAutodownloadBytes = action.payload
    },
  },
})

export const settingsActions = settingsSlice.actions
export const settingsReducer = settingsSlice.reducer
