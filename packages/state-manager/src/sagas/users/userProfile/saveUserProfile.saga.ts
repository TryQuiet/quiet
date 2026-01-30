import { type PayloadAction } from '@reduxjs/toolkit'
import { call, select, apply, put, take } from 'typed-redux-saga'
import {
  UserProfile,
  UserProfileDisplayData,
  SocketActions,
  SaveUserProfileActionPayload,
  SetUserProfilePayload,
  FileMetadata,
  DownloadState,
  DownloadStatus,
  PROFILE_PHOTO_CHANNEL_ID,
} from '@quiet/types'

import { identitySelectors } from '../../identity/identity.selectors'
import { type Socket, applyEmitParams } from '../../../types'
import { createLogger } from '../../../utils/logger'
import { usersActions } from '../users.slice'
import { userProfileSelectors } from './userProfile.selectors'
import { filesActions } from '../../files/files.slice'
import { filesSelectors } from '../../files/files.selectors'
import { generateMessageId } from '../../messages/utils/message.utils'

const logger = createLogger('saveUserProfileSaga')

export function* saveUserProfileSaga(socket: Socket, action: PayloadAction<SaveUserProfileActionPayload>): Generator {
  const identity = yield* select(identitySelectors.currentIdentity)

  if (!identity || !identity.userId) {
    logger.error('No userId found in identity, cannot save profile')
    yield* put(usersActions.setSaveUserProfileError('No userId found in identity, cannot save profile'))
    return
  }

  let profilePhotoMetadata: FileMetadata | undefined = undefined

  if (action.payload.photo) {
    if (!profilePhotoMetadata) {
      logger.info('No profile photo metadata found, starting upload process')
      const file = action.payload.photo!
      const id = yield* call(generateMessageId)

      const profilePhotoMessageId = `profile-photo-${identity.userId}-${id}`
      const media: FileMetadata = {
        name: `profile-photo-${identity.userId}`,
        ext: '.' + (file.name || '').split('.').pop(),
        path: (file as any).path,
        cid: `attaching_${profilePhotoMessageId}`,
        message: {
          id: profilePhotoMessageId,
          channelId: PROFILE_PHOTO_CHANNEL_ID,
        },
      }

      yield* apply(
        socket,
        socket.emit,
        applyEmitParams(SocketActions.ATTACH_FILE, {
          file: media,
          peerId: identity.networkInfo.peerId.id,
        })
      )

      yield* put(
        filesActions.updateDownloadStatus({
          mid: profilePhotoMessageId,
          cid: `attaching_${profilePhotoMessageId}`,
          downloadState: DownloadState.Attaching,
          downloadProgress: undefined,
        })
      )

      while (true) {
        const uploadAction: ReturnType<typeof filesActions.updateDownloadStatus> = yield* take(
          filesActions.updateDownloadStatus
        )

        if (
          uploadAction.payload.mid === profilePhotoMessageId &&
          uploadAction.payload.downloadState === DownloadState.Hosted
        ) {
          logger.info('Profile photo uploaded successfully')

          const profilePhotos = yield* select(filesSelectors.profilePhotos)
          const fileMetadata = profilePhotos[profilePhotoMessageId]

          if (fileMetadata) {
            profilePhotoMetadata = fileMetadata
            logger.info('Profile photo metadata found in state')
            break
          } else {
            logger.error('File metadata not found after upload')
            yield* put(usersActions.setSaveUserProfileError('Failed to get profile photo metadata after upload'))
            return
          }
        }

        if (
          uploadAction.payload.mid === profilePhotoMessageId &&
          (uploadAction.payload.downloadState === DownloadState.Canceled ||
            uploadAction.payload.downloadState === DownloadState.Malicious)
        ) {
          logger.error('Profile photo upload failed')
          yield* put(usersActions.setSaveUserProfileError('Profile photo upload failed'))
          return
        }
      }
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
    profilePhoto: profilePhotoMetadata,
    // Clear the base64 photo when using attachment-based photo
    photo: profilePhotoMetadata ? undefined : existingUserProfile?.photo,
  }

  const socketPayload: SetUserProfilePayload = {
    profile: {
      ...userProfile,
      profilePhoto: userProfile.profilePhoto
        ? {
            ...userProfile.profilePhoto,
            path: null,
          }
        : undefined,
    },
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
