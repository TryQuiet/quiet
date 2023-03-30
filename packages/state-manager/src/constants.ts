export const MAIN_CHANNEL = 'general'

export const AUTODOWNLOAD_SIZE_LIMIT = 20971520 // 20 MB

export const PUSH_NOTIFICATION_CHANNEL = '_PUSH_NOTIFICATION_'
export const WEBSOCKET_CONNECTION_CHANNEL = '_WEBSOCKET_CONNECTION_'
export const INIT_CHECK_CHANNEL = '_INIT_CHECK_'
export const BACKEND_CLOSED_CHANNEL = '_BACKEND_CLOSED_'

export const ONION_ADDRESS_REGEX = /^[a-z0-9]{56}$/g

export enum InvitationParams {
  CODE = 'code'
}

export enum Site {
  DOMAIN = 'tryquiet.org',
  JOIN_PAGE = 'join'
}
