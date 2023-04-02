import mirrorKey from 'keymirror'

export const DEV_DATA_DIR = 'Quietdev'
export const DATA_DIR = 'Quiet'
export const ONION_ADDRESS_REGEX = /^[a-z0-9]{56}$/g

export const actionTypes = mirrorKey({
  SET_APP_VERSION: undefined
})

export const notificationFilterType = {
  ALL_MESSAGES: 1,
  MENTIONS: 2,
  NONE: 3,
  MUTE: 4
}
export const soundType = {
  NONE: 0,
  POW: 1,
  BANG: 2,
  SPLAT: 3
}

export enum InvitationParams {
  CODE = 'code'
}

export enum Site {
  DOMAIN = 'tryquiet.org',
  JOIN_PAGE = 'join'
}
