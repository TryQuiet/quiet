import { type PayloadAction } from '@reduxjs/toolkit'
import { call, select, apply, put } from 'typed-redux-saga'
import {
  UserProfile,
  UserProfileDisplayData,
  SocketActions,
  SaveUserProfileActionPayload,
  SetUserProfilePayload,
} from '@quiet/types'
import { fileToBase64String } from '@quiet/common'

import { identitySelectors } from '../../identity/identity.selectors'
import { type Socket, applyEmitParams } from '../../../types'
import { createLogger } from '../../../utils/logger'
import { usersActions } from '../users.slice'
import { userProfileSelectors } from './userProfile.selectors'

const logger = createLogger('saveUserProfileSaga')

export function* saveUserProfileSaga(socket: Socket, action: PayloadAction<SaveUserProfileActionPayload>): Generator {
  const identity = yield* select(identitySelectors.currentIdentity)

  if (!identity || !identity.userId) {
    logger.error('No userId found in identity, cannot save profile')
    return
  }

  let base64EncodedPhoto: string | undefined = undefined
  if (action.payload.photo) {
    try {
      base64EncodedPhoto = yield* call(fileToBase64String, action.payload.photo)
    } catch (err) {
      logger.error('Failed to base64 encode profile photo', err)
      return
    }
  }

  const existingUserProfile = yield* select(userProfileSelectors.myUserProfile)
  if (!existingUserProfile) {
    logger.error('No existing user profile found, cannot save profile')
    return
  }
  const userProfile: UserProfile = {
    ...existingUserProfile,
    nickname:
      action.payload.nickname && action.payload.nickname.trim() !== ''
        ? action.payload.nickname
        : (existingUserProfile?.nickname ?? ''),
    bio: action.payload.bio && action.payload.bio.trim() !== '' ? action.payload.bio : existingUserProfile?.bio,
    photo: base64EncodedPhoto && base64EncodedPhoto.trim() !== '' ? base64EncodedPhoto : existingUserProfile?.photo,
  }

  const socketPayload: SetUserProfilePayload = {
    profile: userProfile,
  }

  yield* put(usersActions.setUserProfile(userProfile))
  yield* apply(socket, socket.emit, applyEmitParams(SocketActions.SET_USER_PROFILE, socketPayload))
}
