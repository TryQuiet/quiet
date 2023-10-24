export const ONION_ADDRESS_REGEX = /^[a-z0-9]{56}$/g
export const PEER_ID_REGEX = /^[a-zA-Z0-9]{46}$/g
export const PSK_LENGTH = 44 // PSK is 256 bits/8 = 32 bytes which encodes to 44 characters base64

export enum Site {
  DEEP_URL_SCHEME_WITH_SEPARATOR = 'quiet://',
  DEEP_URL_SCHEME = 'quiet',
  DOMAIN = 'tryquiet.org',
  MAIN_PAGE = 'https://tryquiet.org/',
  JOIN_PAGE = 'join',
  PSK_PARAM_KEY = 'k',
}

export const QUIET_JOIN_PAGE = `${Site.MAIN_PAGE}${Site.JOIN_PAGE}`
