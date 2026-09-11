/**
 * Turns the file the user picked in the Edit profile view into the file the
 * upload saga should send.
 *
 * `saveUserProfileSaga` uploads a profile photo from disk (it puts `photo.path`
 * into an ATTACH_FILE payload), not from the File's bytes, so a compressed
 * photo has to exist on disk before the action is dispatched. The renderer
 * cannot write files itself, hence the trip through the main process.
 */
import { ipcRenderer, webUtils } from 'electron'

import {
  COMPRESSED_PROFILE_PHOTO_MIME,
  compressProfilePhoto,
  type ProfilePhotoCompressionResult,
} from './compressProfilePhoto'

/**
 * Dedicated IPC channel for writing the compressed photo to a temp file.
 *
 * Deliberately NOT the existing `writeTempFile` channel: `Channel.tsx` keeps a
 * permanent `ipcRenderer.on('writeTempFileReply', ...)` listener that adds every
 * reply it sees to the message composer's pending attachments, so reusing that
 * channel would make the profile photo show up as an unsent chat attachment.
 * A request/response `invoke` channel has no such broadcast.
 */
export const WRITE_PROFILE_PHOTO_TEMP_FILE_CHANNEL = 'write-profile-photo-temp-file'

export interface WriteProfilePhotoTempFileRequest {
  fileName: string
  ext: string
  fileBuffer: Uint8Array
}

export interface WriteProfilePhotoTempFileResponse {
  path: string
  name: string
  ext: string
}

export interface PrepareProfilePhotoDeps {
  compress: (file: File) => Promise<ProfilePhotoCompressionResult | null>
  writeTempFile: (request: WriteProfilePhotoTempFileRequest) => Promise<WriteProfilePhotoTempFileResponse>
  getPathForFile: (file: File) => string
}

export const defaultPrepareProfilePhotoDeps: PrepareProfilePhotoDeps = {
  compress: compressProfilePhoto,
  writeTempFile: async request => await ipcRenderer.invoke(WRITE_PROFILE_PHOTO_TEMP_FILE_CHANNEL, request),
  // Since Electron 32 `File.path` is gone and the on-disk path has to be asked
  // for explicitly.
  getPathForFile: file => webUtils.getPathForFile(file),
}

/** A File whose on-disk location the upload saga can read. */
export type UploadableProfilePhoto = File & { path: string }

const withPath = (file: File, path: string): UploadableProfilePhoto => {
  // `path` is not a standard File property; the saga reads it off the payload.
  // It has to be defined rather than assigned: Chromium below Electron 32 still
  // declares `File.prototype.path` as a getter, and a plain assignment to it
  // throws in strict mode.
  Object.defineProperty(file, 'path', { value: path, writable: true, configurable: true, enumerable: true })
  return file as UploadableProfilePhoto
}

/**
 * Always returns something dispatchable.
 *
 * When the photo cannot be compressed - a non-image, a corrupt file, an IPC
 * failure, or an image too big to rescue - the user's original file is returned
 * unchanged, which is exactly what this code did before compression existed.
 * The size guard in `saveUserProfileSaga` stays the backstop that turns an
 * unrescuable oversized photo into the too-large banner.
 */
export const prepareProfilePhotoForUpload = async (
  photo: File,
  deps: PrepareProfilePhotoDeps = defaultPrepareProfilePhotoDeps
): Promise<UploadableProfilePhoto> => {
  const original = () => withPath(photo, deps.getPathForFile(photo))

  let result: ProfilePhotoCompressionResult | null
  try {
    result = await deps.compress(photo)
  } catch {
    return original()
  }

  if (!result || !result.compressed) return original()

  const { blob, name, ext } = result.photo
  try {
    const buffer = new Uint8Array(await blob.arrayBuffer())
    const written = await deps.writeTempFile({ fileName: name, ext, fileBuffer: buffer })
    const compressedFile = new File([blob], `${written.name}${written.ext}`, { type: COMPRESSED_PROFILE_PHOTO_MIME })
    return withPath(compressedFile, written.path)
  } catch {
    return original()
  }
}
