import { PayloadAction } from '@reduxjs/toolkit'
import { createLogger } from '../../../utils/logger'
import { apply, put, select } from 'typed-redux-saga'
import { userProfileSelectors } from './userProfile.selectors'
import { SocketActions, UserProfile, UserProfilesUpdatedPayload } from '@quiet/types'
import { applyEmitParams, Socket } from '../../../types'
import { usersActions } from '../users.slice'
import { identitySelectors } from '../../identity/identity.selectors'

const logger = createLogger('updateUserProfilesSaga')

export function* updateUserProfilesSaga(socket: Socket, action: PayloadAction<UserProfile[]>): Generator {
  logger.info(`Updating user profiles (profile count = ${action.payload.length})`)
  const existingProfiles = yield* select(userProfileSelectors.userProfiles)
  const currentIdentity = yield* select(identitySelectors.currentIdentity)
  const output: UserProfilesUpdatedPayload = {
    new: [],
    updates: [],
  }
  const updates = { ...existingProfiles }
  const cachedCurrentUserProfile =
    currentIdentity?.userId != null ? (existingProfiles[currentIdentity.userId] as UserProfile | undefined) : undefined
  const currentUserProfileIsStored =
    cachedCurrentUserProfile != null &&
    action.payload.some(profile => profile.userId === cachedCurrentUserProfile.userId)

  if (cachedCurrentUserProfile != null && !currentUserProfileIsStored) {
    logger.info('Migrating cached current user profile into storage', cachedCurrentUserProfile.userId)
    const response = yield* apply(
      socket,
      socket.emitWithAck,
      applyEmitParams(SocketActions.SET_USER_PROFILE, {
        profile: {
          ...cachedCurrentUserProfile,
          fileMetadata: cachedCurrentUserProfile.fileMetadata
            ? {
                ...cachedCurrentUserProfile.fileMetadata,
                path: null,
              }
            : undefined,
          profilePhoto: cachedCurrentUserProfile.profilePhoto
            ? {
                ...cachedCurrentUserProfile.profilePhoto,
                path: null,
              }
            : undefined,
        },
      })
    )
    if (!response?.success) {
      logger.warn('Failed to migrate cached current user profile into storage', response?.error)
    }
  }

  for (const userProfile of action.payload) {
    if (existingProfiles[userProfile.userId]) {
      const existingProfile = existingProfiles[userProfile.userId]

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
      if (JSON.stringify(existingProfile) !== JSON.stringify(updatedProfile)) {
        output.updates.push(updatedProfile)
      }
    } else {
      updates[userProfile.userId] = userProfile
      output.new.push(userProfile)
    }
  }
  const updatedUserProfiles = Object.values(updates)
  logger.debug(`Updating user profiles in redux store`)
  yield* put(usersActions.setUserProfiles(updatedUserProfiles))

  if (output.new.length > 0 || output.updates.length > 0) {
    logger.debug(`Emitting user profiles updated event`)
    yield* apply(socket, socket.emit, applyEmitParams(SocketActions.USER_PROFILES_UPDATED, output))
  } else {
    logger.trace('Skipping user profile updated event, no new or updated profiles')
  }
  logger.info(`Done`)
}
