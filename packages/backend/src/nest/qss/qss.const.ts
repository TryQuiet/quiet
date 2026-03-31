export const CLIENT_TRANSPORTS = ['websocket']
export const QSS_RECONNECT_DELAY_MS = 60_000

export enum QSSAuthConnStatus {
  NOT_STARTED = 'NOT_STARTED',
  INACTIVE = 'INACTIVE',
  STARTING = 'STARTING',
  CONNECTED = 'CONNECTED',
}
