export const CLIENT_TRANSPORTS = ['websocket']
export const QSS_CONNECT_TIMEOUT_INITIAL_MS = 10_000
export const QSS_CONNECT_TIMEOUT_BACKOFF_FACTOR = 1.25
export const QSS_CONNECT_TIMEOUT_MAX_MS = 30_000
export const QSS_RECONNECT_DELAY_MS = 50
export const QSS_RECONNECT_MAX_DELAY_MS = 60_000
export const QSS_RECONNECT_BACKOFF_FACTOR = 2
export const LOCAL_QSS_HOST_PATTERN =
  /^(?:(?:.+\.)?localhost|(?:.+\.)?local|host\.docker\.internal|0\.0\.0\.0|127\.\d+\.\d+\.\d+|10\.\d+\.\d+\.\d+|169\.254\.\d+\.\d+|192\.168\.\d+\.\d+|172\.(?:1[6-9]|2\d|3[01])\.\d+\.\d+|::1|f[cd][0-9a-f]{2}:.*|fe[89ab][0-9a-f]:.*)$/i

export enum QSSAuthConnStatus {
  NOT_STARTED = 'NOT_STARTED',
  INACTIVE = 'INACTIVE',
  STARTING = 'STARTING',
  CONNECTED = 'CONNECTED',
}
