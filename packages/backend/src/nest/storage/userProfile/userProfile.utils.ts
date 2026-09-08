import { SetUserProfileResponse, UserProfile } from '@quiet/types'
import { createLogger } from '../../common/logger'

const logger = createLogger('UserProfileStoreUtils')

export const checkImgHeader = (buffer: Uint8Array, header: number[]): boolean => {
  if (buffer.length < header.length) {
    return false
  }

  for (let i = 0; i < header.length; i++) {
    if (buffer[i] !== header[i]) {
      return false
    }
  }
  return true
}

/**
 * Check magic byte sequence to determine if buffer is a PNG image.
 */
export const isPng = (buffer: Uint8Array): boolean => {
  // https://en.wikipedia.org/wiki/PNG
  const pngHeader = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]

  return checkImgHeader(buffer, pngHeader)
}

/**
 * Check magic byte sequence to determine if buffer is a JPEG image.
 */
export const isJpeg = (buffer: Uint8Array): boolean => {
  // https://en.wikipedia.org/wiki/JPEG
  const jpegHeader = [0xff, 0xd8, 0xff]

  return checkImgHeader(buffer, jpegHeader)
}

/**
 * Check magic byte sequence to determine if buffer is a GIF image.
 */
export const isGif = (buffer: Uint8Array): boolean => {
  // https://en.wikipedia.org/wiki/GIF
  // GIF images are different from JPEG and PNG in that there are two slightly different magic number sequences that translate to GIF89a and GIF87a
  const gifHeader89 = [0x47, 0x49, 0x46, 0x38, 0x39, 0x61]
  const gifHeader87 = [0x47, 0x49, 0x46, 0x38, 0x37, 0x61]
  const headers = [gifHeader89, gifHeader87]

  for (const header of headers) {
    if (checkImgHeader(buffer, header)) {
      return true
    }
  }

  return false
}

/**
 * Validate a profile photo in a user profile
 *
 * @param photoString Base64 string representing the photo file that was uploaded
 * @param pubKey Public key string for logging purposes
 * @returns True if photo is valid and false if not
 */
export const validatePhoto = (photoString: string, pubKey: string): SetUserProfileResponse => {
  // validate that we have the photo as a base64 string
  if (typeof photoString !== 'string') {
    logger.error('Expected PNG, JPEG or GIF as base64 string for user profile photo', pubKey)
    return { success: false, error: 'Internal error: Expected base64 string' }
  }

  try {
    const photoBytes = base64DataURLToByteArray(photoString)

    // validate that the type is approved and has a matching magic number header
    if (
      !(photoString.startsWith('data:image/png;base64,') && isPng(photoBytes)) &&
      !(photoString.startsWith('data:image/jpeg;base64,') && isJpeg(photoBytes))
      // !(photoString.startsWith('data:image/gif;base64,') && isGif(photoBytes)) // disabling GIF support for now
    ) {
      logger.error('Expected valid PNG or JPEG for user profile photo', pubKey)
      return { success: false, error: 'Invalid photo format. Must be PNG or JPEG' }
    }

    // Apply different size limits based on image format:
    const MAX_SIZE_JPEG = 200 * 1024 // 200KB in bytes
    const MAX_SIZE_PNG_GIF = 200 * 1024 // 200KB in bytes

    if (photoString.startsWith('data:image/jpeg;base64,')) {
      if (photoBytes.length > MAX_SIZE_JPEG) {
        const sizeInMB = (photoBytes.length / (1024 * 1024)).toFixed(2)
        logger.error(
          `JPEG profile photo must be less than or equal to ${MAX_SIZE_JPEG / (1024 * 1024)}MB (received: ${sizeInMB}MB)`
        )
        return {
          success: false,
          error: `JPEG profile photo must be less than or equal to ${MAX_SIZE_JPEG / (1024 * 1024)}MB (received: ${sizeInMB}MB)`,
        }
      }
    } else {
      // PNG or GIF format - restrict to 200KB
      if (photoBytes.length > MAX_SIZE_PNG_GIF) {
        const sizeInKB = (photoBytes.length / 1024).toFixed(2)
        logger.error(
          `PNG/GIF profile photo must be less than or equal to ${MAX_SIZE_PNG_GIF / 1024}KB (received: ${sizeInKB}KB)`
        )
        return {
          success: false,
          error: `PNG/GIF profile photo must be less than or equal to ${MAX_SIZE_PNG_GIF / 1024}KB (received: ${sizeInKB}KB)`,
        }
      }
    }
  } catch (e) {
    logger.error('Error while validating photo', pubKey, e)
    return { success: false, error: 'Internal error: Failed to validate photo' }
  }

  return { success: true }
}

/**
 * Validates a user profile, including its photo if present.
 */
export const validateUserProfile = async (userProfile: UserProfile): Promise<SetUserProfileResponse> => {
  try {
    if (userProfile?.photo) {
      const photoValidation = validatePhoto(userProfile.photo ?? '', userProfile.userId)
      if (!photoValidation.success) {
        return { success: false, error: photoValidation.error }
      }
    }
  } catch (err) {
    logger.error('Error validating user profile:', userProfile.userId, err)
    return { success: false, error: 'Internal error: Failed to validate user profile' }
  }
  return { success: true }
}

/**
 * Takes a base64 data URI string that starts with 'data:*\/*;base64,'
 * as returned from
 * https://developer.mozilla.org/en-US/docs/Web/API/FileReader/readAsDataURL
 * and converts it to a Uint8Array.
 */
export const base64DataURLToByteArray = (contents: string): Uint8Array => {
  const [header, base64Data] = contents.split(',')
  if (!header.startsWith('data:') || !header.endsWith(';base64')) {
    throw new Error('Expected base64 data URI')
  }
  const chars = atob(base64Data)
  const bytes = new Array(chars.length)
  for (let i = 0; i < chars.length; i++) {
    bytes[i] = chars.charCodeAt(i)
  }
  return new Uint8Array(bytes)
}
