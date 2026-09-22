export const DESKTOP_DEV_DATA_DIR = 'Quietdev'
export const DESKTOP_DATA_DIR = 'Quiet11'

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

/** User-facing message shown when a profile photo we cannot re-encode exceeds the limit above. */
export const PROFILE_PHOTO_TOO_LARGE_ERROR = `Photo is too large (max ${
  MAX_PROFILE_PHOTO_SIZE_BYTES / 1024
}KB). Please choose a smaller image.`

/**
 * Attachments the backend's `ImageCompressionService` re-encodes.
 *
 * JPEG has been compressed for every attachment since #3363. PNG is added for
 * profile photos only: the service preserves the PNG mime type so transparency
 * survives, but re-encoding every PNG dropped into a channel is a separate
 * decision that `ipfs-file-manager.service.spec.ts` pins the other way.
 *
 * Animated formats are deliberately absent — Jimp would flatten them to a
 * single frame, so an oversized animated profile photo is refused instead.
 */
export const COMPRESSIBLE_IMAGE_EXTENSIONS = ['.jpg', '.jpeg']
export const PROFILE_PHOTO_COMPRESSIBLE_EXTENSIONS = [...COMPRESSIBLE_IMAGE_EXTENSIONS, '.png']

/** Whether an oversized profile photo of this type will be shrunk rather than refused. */
export const isProfilePhotoCompressible = (ext: string | undefined): boolean =>
  ext != null && PROFILE_PHOTO_COMPRESSIBLE_EXTENSIONS.includes(ext.toLowerCase())
