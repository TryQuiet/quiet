export const DESKTOP_DEV_DATA_DIR = 'Quietdev'
export const DESKTOP_DATA_DIR = 'Quiet9'

export enum Site {
  DOMAIN = 'tryquiet.org',
  MAIN_PAGE = 'https://tryquiet.org/',
  JOIN_PAGE = 'join',
}

export const QUIET_JOIN_PAGE = `${Site.MAIN_PAGE}${Site.JOIN_PAGE}`

export enum JoiningAnotherCommunityWarning {
  TITLE = 'You already started to connect to another community',
  MESSAGE = "We're sorry but for now you can only be a member of a single community at a time",
}

export enum AlreadyBelongToCommunityWarning {
  TITLE = 'You already belong to a community',
  MESSAGE = "We're sorry but for now you can only be a member of a single community at a time",
}

export enum InvalidInvitationLinkError {
  TITLE = 'Invalid invitation link',
  MESSAGE = 'Please check your invitation link and try again',
}

/**
 * Maximum size, in bytes, of a user's profile photo.
 *
 * Profile photos are replicated to and auto-downloaded by every member of a
 * community, so they are kept far smaller than ordinary attachments. This is the
 * same 200KB budget that has always been enforced on the deprecated base64
 * inline photos (see `validatePhoto` in the backend); attachment-based photos
 * are held to it too so that the limit does not depend on how the photo happens
 * to be transported.
 */
export const MAX_PROFILE_PHOTO_SIZE_BYTES = 200 * 1024

/** User-facing message shown when the chosen profile photo exceeds the limit above. */
export const PROFILE_PHOTO_TOO_LARGE_ERROR = `Photo is too large (max ${
  MAX_PROFILE_PHOTO_SIZE_BYTES / 1024
}KB). Please choose a smaller image.`
