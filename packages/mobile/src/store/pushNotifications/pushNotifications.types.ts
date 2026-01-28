export enum NotificationPermissionStatus {
  NotDetermined = 'notDetermined',
  Granted = 'granted',
  Denied = 'denied',
  Provisional = 'provisional',
}

export interface PushNotificationState {
  permissionStatus: NotificationPermissionStatus
  permissionRequested: boolean
  deviceToken: string | null
}
