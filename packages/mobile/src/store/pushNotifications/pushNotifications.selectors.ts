import { createSelector } from 'reselect'
import { StoreKeys } from '../store.keys'
import { CreatedSelectors, StoreState } from '../store.types'
import { NotificationPermissionStatus } from './pushNotifications.types'

const pushNotificationsSlice: CreatedSelectors[StoreKeys.PushNotifications] = (state: StoreState) =>
  state[StoreKeys.PushNotifications]

export const permissionStatus = createSelector(pushNotificationsSlice, state => state.permissionStatus)

export const permissionRequested = createSelector(pushNotificationsSlice, state => state.permissionRequested)

export const deviceToken = createSelector(pushNotificationsSlice, state => state.deviceToken)

export const isPermissionDenied = createSelector(
  permissionStatus,
  status => status === NotificationPermissionStatus.Denied
)

export const pushNotificationsSelectors = {
  permissionStatus,
  permissionRequested,
  deviceToken,
  isPermissionDenied,
}
