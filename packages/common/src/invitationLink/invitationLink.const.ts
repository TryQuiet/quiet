// V1 invitation code format (p2p without relay)
export const PSK_PARAM_KEY = 'k'
export const OWNER_ORBIT_DB_IDENTITY_PARAM_KEY = 'o'
export const PEER_ADDRESS_KEY = 'p'

// v2/v3 invitation code format (v2 = v1 with LFA integration, v3 = v2 with QSS integration)
export const AUTH_DATA_KEY = 'a'
export const COMMUNITY_NAME_KEY = 'c'
export const INVITATION_SEED_KEY = 's'
export const TEAM_ID_KEY = 't'
export const SALT_KEY = 'l'
export const USER_ID_KEY = 'u'
export const USER_NAME_KEY = 'n'
export const QSS_ENABLED_KEY = 'q'
export const QSS_ENDPOINT_KEY = 'e'
export const AUTH_DATA_OBJECT_KEY = 'authData'

// v4/v5 invitation code format (v4 = v2 with guaranteed team ID, v5 = v4 with QSS integration)
export const VERSION_KEY = 'v'
export const INVITATION_KIND_KEY = 'i'

export const DEEP_URL_SCHEME_WITH_SEPARATOR = 'quiet://'
export const DEEP_URL_SCHEME = 'quiet'
