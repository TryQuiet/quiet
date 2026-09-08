import { createSelector } from 'reselect'
import { StoreKeys } from '../store.keys'
import { CreatedSelectors, StoreState } from '../store.types'

const pushNotificationsSlice: CreatedSelectors[StoreKeys.PushNotifications] = (state: StoreState) =>
  state[StoreKeys.PushNotifications]

export const permissionStatus = createSelector(pushNotificationsSlice, state => state.permissionStatus)

export const permissionRequested = createSelector(pushNotificationsSlice, state => state.permissionRequested)
export const backgroundTorEnabled = createSelector(pushNotificationsSlice, state => state.backgroundTorEnabled)

export const pushNotificationsSelectors = {
  permissionStatus,
  permissionRequested,
  backgroundTorEnabled,
}
