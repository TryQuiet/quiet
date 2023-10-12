export const ONION_ADDRESS_REGEX = /^[a-z0-9]{56}$/g
export const PEER_ID_REGEX = /^[a-zA-Z0-9]{46}$/g

export enum Site {
  DOMAIN = 'tryquiet.org',
  MAIN_PAGE = 'https://tryquiet.org/',
  JOIN_PAGE = 'join',
  PSK_PARAM_KEY = 'k',
}

export const QUIET_JOIN_PAGE = `${Site.MAIN_PAGE}${Site.JOIN_PAGE}`
