/**
 * Shrinks an oversized profile photo so that it fits the community-wide profile
 * photo budget instead of being refused outright.
 *
 * Profile photos are force-replicated to and auto-downloaded by every member of
 * a community, so `MAX_PROFILE_PHOTO_SIZE_BYTES` is a hard budget rather than a
 * nicety. Refusing a 4MB phone photo is technically correct but useless to the
 * user, who has no way to resize it inside Quiet; re-encoding it is.
 *
 * Only oversized photos are touched. A photo that already fits is passed
 * through byte for byte, so nothing about today's behaviour changes for the
 * common case, and PNG/GIF transparency and animation survive.
 */
import { MAX_PROFILE_PHOTO_SIZE_BYTES } from '@quiet/common'

/**
 * Longest edge, in CSS pixels, of a re-encoded profile photo.
 *
 * The photo is never rendered larger than 96 CSS px anywhere in the app (see the
 * `size` prop of `ProfilePhoto`), so 512 leaves better than 5x headroom for
 * high-DPI displays and for the photo being shown larger in future, while still
 * being small enough that the quality loop below almost always lands on its
 * first iteration.
 */
export const MAX_PROFILE_PHOTO_EDGE_PX = 512

/** JPEG quality tried first, then stepped down until the photo fits. */
export const PROFILE_PHOTO_QUALITY_MAX = 0.92
/** Lowest JPEG quality we are willing to ship. Below this, artefacts dominate. */
export const PROFILE_PHOTO_QUALITY_MIN = 0.5
export const PROFILE_PHOTO_QUALITY_STEP = 0.08

export const COMPRESSED_PROFILE_PHOTO_EXT = '.jpg'
export const COMPRESSED_PROFILE_PHOTO_MIME = 'image/jpeg'
export const COMPRESSED_PROFILE_PHOTO_NAME = `profile-photo${COMPRESSED_PROFILE_PHOTO_EXT}`

/** A decoded still image, ready to be drawn onto a canvas. */
export interface DecodedProfilePhoto {
  width: number
  height: number
  source: CanvasImageSource
}

/**
 * The seams that need a real browser. Injected so that the scaling and quality
 * policy below can be unit tested under jsdom, which has no canvas.
 */
export interface ProfilePhotoCodec {
  decode: (file: File) => Promise<DecodedProfilePhoto>
  encode: (decoded: DecodedProfilePhoto, width: number, height: number, quality: number) => Promise<Blob | null>
}

export interface CompressedProfilePhoto {
  blob: Blob
  name: string
  ext: string
  width: number
  height: number
  quality: number
}

export type ProfilePhotoCompressionResult =
  /** The photo already fits; upload the user's file untouched. */
  | { compressed: false; file: File }
  /** The photo was re-encoded as a JPEG that fits the budget. */
  | { compressed: true; photo: CompressedProfilePhoto }

const isImage = (file: File): boolean => (file.type || '').startsWith('image/')

/** Scales `width` x `height` down so that its longest edge is at most `maxEdge`. */
export const scaleToFit = (width: number, height: number, maxEdge: number): { width: number; height: number } => {
  const longEdge = Math.max(width, height)
  if (longEdge <= maxEdge) return { width, height }
  const ratio = maxEdge / longEdge
  return {
    width: Math.max(1, Math.round(width * ratio)),
    height: Math.max(1, Math.round(height * ratio)),
  }
}

const defaultDecode = async (file: File): Promise<DecodedProfilePhoto> => {
  const bitmap = await createImageBitmap(file)
  return { width: bitmap.width, height: bitmap.height, source: bitmap }
}

const defaultEncode = async (
  decoded: DecodedProfilePhoto,
  width: number,
  height: number,
  quality: number
): Promise<Blob | null> => {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext('2d')
  if (!context) return null
  // JPEG has no alpha channel. Painting white first keeps a transparent PNG from
  // coming out with a black background.
  context.fillStyle = '#ffffff'
  context.fillRect(0, 0, width, height)
  context.drawImage(decoded.source, 0, 0, width, height)
  return await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, COMPRESSED_PROFILE_PHOTO_MIME, quality))
}

export const defaultProfilePhotoCodec: ProfilePhotoCodec = {
  decode: defaultDecode,
  encode: defaultEncode,
}

/** JPEG qualities to try, highest first. */
const qualityLadder = (): number[] => {
  const qualities: number[] = []
  // Guard against float drift making the loop overshoot PROFILE_PHOTO_QUALITY_MIN.
  for (let q = PROFILE_PHOTO_QUALITY_MAX; q >= PROFILE_PHOTO_QUALITY_MIN - 1e-9; q -= PROFILE_PHOTO_QUALITY_STEP) {
    qualities.push(Math.round(q * 100) / 100)
  }
  return qualities
}

/**
 * Returns the photo to upload, or `null` when the file cannot be rescued.
 *
 * `null` means "I could not make this into an image that fits": a non-image, a
 * corrupt file, or something so large that even 256px at quality 0.5 is over
 * budget. Callers fall back to uploading the user's original file, which the
 * size guard in `saveUserProfileSaga` then turns into the too-large banner.
 */
export const compressProfilePhoto = async (
  file: File,
  codec: ProfilePhotoCodec = defaultProfilePhotoCodec
): Promise<ProfilePhotoCompressionResult | null> => {
  if (isImage(file) && file.size <= MAX_PROFILE_PHOTO_SIZE_BYTES) {
    return { compressed: false, file }
  }

  let decoded: DecodedProfilePhoto
  try {
    decoded = await codec.decode(file)
  } catch {
    return null
  }
  if (!decoded?.width || !decoded?.height) return null

  // One pass at the target edge; if even the lowest quality is still over
  // budget, halve the edge and try the ladder once more.
  for (const maxEdge of [MAX_PROFILE_PHOTO_EDGE_PX, Math.round(MAX_PROFILE_PHOTO_EDGE_PX / 2)]) {
    const { width, height } = scaleToFit(decoded.width, decoded.height, maxEdge)
    for (const quality of qualityLadder()) {
      let blob: Blob | null
      try {
        blob = await codec.encode(decoded, width, height, quality)
      } catch {
        return null
      }
      if (!blob) return null
      if (blob.size <= MAX_PROFILE_PHOTO_SIZE_BYTES) {
        return {
          compressed: true,
          photo: {
            blob,
            name: COMPRESSED_PROFILE_PHOTO_NAME,
            ext: COMPRESSED_PROFILE_PHOTO_EXT,
            width,
            height,
            quality,
          },
        }
      }
    }
  }

  return null
}
