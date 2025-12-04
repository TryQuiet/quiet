import { type PayloadAction } from '@reduxjs/toolkit'
import { call, select, apply, put } from 'typed-redux-saga'
import {
  UserProfile,
  UserProfileDisplayData,
  SocketActions,
  SaveUserProfileActionPayload,
  SetUserProfilePayload,
  FileMetadata,
  MessageType,
  DownloadState,
  imagesExtensions,
} from '@quiet/types'
import { getFileData } from '@quiet/common'
import fs from 'fs'

import { identitySelectors } from '../../identity/identity.selectors'
import { type Socket, applyEmitParams } from '../../../types'
import { createLogger } from '../../../utils/logger'
import { usersActions } from '../users.slice'
import { userProfileSelectors } from './userProfile.selectors'
import { generateMessageId } from '../../messages/utils/message.utils'
import { filesActions } from '../../files/files.slice'

// Maximum profile photo size: 5MB
const MAX_PROFILE_PHOTO_SIZE_BYTES = 5 * 1024 * 1024

const logger = createLogger('saveUserProfileSaga')

export function* saveUserProfileSaga(socket: Socket, action: PayloadAction<SaveUserProfileActionPayload>): Generator {
  const identity = yield* select(identitySelectors.currentIdentity)

  if (!identity || !identity.userId) {
    logger.error('No userId found in identity, cannot save profile')
    yield* put(usersActions.setSaveUserProfileError('No userId found in identity, cannot save profile'))
    return
  }

  let photoFileMetadata: FileMetadata | undefined = undefined
  if (action.payload.photo) {
    const photo: any = action.payload.photo as any

    // Electron provides the file path on the File object
    if (!photo.path) {
      logger.error('Photo file is missing path property')
      yield* put(usersActions.setSaveUserProfileError('Photo file is missing path property'))
      return
    }

    logger.info(`Creating profile photo metadata from path: ${photo.path}`)

    try {
      // Decode file path if it has file:// protocol
      const fileProtocol = 'file://'
      let filePath = photo.path
      filePath = decodeURIComponent(filePath.startsWith(fileProtocol) ? filePath.slice(fileProtocol.length) : filePath)

      // Extract file metadata using getFileData
      const fileData = getFileData(filePath)
      const fileKey = Object.keys(fileData)[0]
      const ext = fileData[fileKey].ext

      // Validate file extension (must be an image)
      if (!imagesExtensions.includes(ext)) {
        logger.error(`Invalid photo file type: ${ext}`)
        yield* put(
          usersActions.setSaveUserProfileError(
            `Invalid file type. Please select an image file (${imagesExtensions.join(', ')})`
          )
        )
        return
      }

      // Check file size
      const stats = fs.statSync(filePath)
      const fileSizeBytes = stats.size

      if (fileSizeBytes > MAX_PROFILE_PHOTO_SIZE_BYTES) {
        const sizeMB = (fileSizeBytes / (1024 * 1024)).toFixed(2)
        const maxSizeMB = (MAX_PROFILE_PHOTO_SIZE_BYTES / (1024 * 1024)).toFixed(0)
        logger.error(`Photo file too large: ${sizeMB}MB (max: ${maxSizeMB}MB)`)
        yield* put(
          usersActions.setSaveUserProfileError(`Photo file is too large (${sizeMB}MB). Maximum size is ${maxSizeMB}MB.`)
        )
        return
      }

      // Generate unique message ID for tracking this profile photo
      const messageId = yield* call(generateMessageId)

      // Create FileMetadata - backend will upload to IPFS and set the real CID
      photoFileMetadata = {
        path: filePath,
        name: fileData[fileKey].name,
        ext: ext,
        cid: '', // Backend will set this after IPFS upload
        size: fileSizeBytes,
        message: {
          id: messageId,
          channelId: '', // Profile photos don't belong to a channel
        },
      }

      logger.info(
        `Created profile photo metadata (${(fileSizeBytes / 1024).toFixed(1)}KB), will be uploaded to IPFS by backend`
      )
    } catch (err) {
      logger.error('Failed to create profile photo metadata', err)
      yield* put(usersActions.setSaveUserProfileError('Failed to process profile photo'))
      return
    }
  }

  const existingUserProfile = yield* select(userProfileSelectors.myUserProfile)
  if (!existingUserProfile) {
    // we expect the backend to setup a user profile for us when we first connect
    logger.error('No existing user profile found, cannot save profile')
    yield* put(usersActions.setSaveUserProfileError('No existing user profile found, cannot save profile'))
    return
  }
  const userProfile: UserProfile = {
    ...existingUserProfile,
    nickname:
      action.payload.nickname && action.payload.nickname.trim() !== ''
        ? action.payload.nickname
        : (existingUserProfile?.nickname ?? ''),
    bio: action.payload.bio && action.payload.bio.trim() !== '' ? action.payload.bio : existingUserProfile?.bio,
    // Use photoFile for new IPFS-based photos, keep existing photo for backward compatibility
    photoFile: photoFileMetadata ?? existingUserProfile?.photoFile,
    photo: photoFileMetadata ? undefined : existingUserProfile?.photo, // Clear photo when using photoFile
  }

  const socketPayload: SetUserProfilePayload = {
    profile: userProfile,
  }

  const response = yield* apply(
    socket,
    socket.emitWithAck,
    applyEmitParams(SocketActions.SET_USER_PROFILE, socketPayload)
  )
  if (!response || !response.success) {
    logger.info('Failed to save user profile', response?.error)
    yield* put(usersActions.setSaveUserProfileError(response?.error || 'Failed to save user profile'))
    return
  }
  yield* put(usersActions.setUserProfile(userProfile))
  yield* put(usersActions.setSaveUserProfileError(null))
}
