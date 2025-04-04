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

const logger = createLogger('saveUserProfileSaga')

export function* saveUserProfileSaga(socket: Socket, action: PayloadAction<SaveUserProfileActionPayload>): Generator {
  const identity = yield* select(identitySelectors.currentIdentity)

  if (!identity || !identity.userId) {
    logger.error('No userId found in identity, cannot save profile')
    return
  }

  let base64EncodedPhoto: string | undefined
  if (action.payload.photo) {
    try {
      base64EncodedPhoto = yield* call(fileToBase64String, action.payload.photo)
    } catch (err) {
      logger.error('Failed to base64 encode profile photo', err)
      return
    }
  }

  const userProfile: UserProfile = {
    userId: identity.userId,
    nickname: action.payload.nickname || identity.userId,
    bio: action.payload.bio,
  }
  if (base64EncodedPhoto) {
    userProfile.photo = base64EncodedPhoto
  }

  logger.info('Saving user profile', userProfile)

  const socketPayload: SetUserProfilePayload = {
    profile: userProfile,
  }

  yield* put(usersActions.setUserProfile(userProfile))
  yield* apply(socket, socket.emit, applyEmitParams(SocketActions.SET_USER_PROFILE, socketPayload))
}
