import { PayloadAction } from '@reduxjs/toolkit'
import { createLogger } from '../../../utils/logger'
import { apply, call, put, select } from 'typed-redux-saga'
import { userProfileSelectors } from './userProfile.selectors'
import { SocketActions, SocketEvents, SocketEventsMap, UserProfile } from '@quiet/types'
import { applyEmitParams, Socket } from '../../../types'
import { usersActions } from '../users.slice'

const logger = createLogger('updateUserProfilesSaga')

export function* updateUserProfilesSaga(socket: Socket, action: PayloadAction<UserProfile[]>): Generator {
  logger.info(`Updating user profiles (profile count = ${action.payload.length})`)
  const userProfiles = yield* select(userProfileSelectors.userProfiles)
  const updates = { ...userProfiles }
  for (const userProfile of action.payload) {
    if (updates[userProfile.userId]) {
      const existingProfile = updates[userProfile.userId]

      const updatedProfile = {
        ...existingProfile,
        ...userProfile,
      }

      // If CID is the same, preserve the existing path
      if (
        userProfile.profilePhoto?.cid &&
        existingProfile.profilePhoto?.cid === userProfile.profilePhoto.cid &&
        existingProfile.profilePhoto?.path
      ) {
        updatedProfile.profilePhoto = {
          ...userProfile.profilePhoto,
          path: existingProfile.profilePhoto.path,
        }
      }

      // If CID changed, ensure path is null (it should be null from userProfile anyway, but let's be explicit)
      if (userProfile.profilePhoto?.cid && existingProfile.profilePhoto?.cid !== userProfile.profilePhoto.cid) {
        updatedProfile.profilePhoto = {
          ...userProfile.profilePhoto,
          path: null,
        }
      }

      updates[userProfile.userId] = updatedProfile
    } else {
      updates[userProfile.userId] = userProfile
    }
  }
  const updatedUserProfiles = Object.values(updates)
  logger.info(`Emitting user profiles updated event`, updatedUserProfiles)
  yield* apply(
    socket,
    socket.emit,
    applyEmitParams(SocketActions.USER_PROFILES_UPDATED, {
      profiles: updatedUserProfiles,
    })
  )
  logger.info(`Updating user profiles in redux store`, updatedUserProfiles)
  yield* put(usersActions.setUserProfiles(updatedUserProfiles))
  logger.info(`Done`)
}
