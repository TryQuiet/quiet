import { put } from 'typed-redux-saga'
import { usersActions } from '../users.slice'
import { filesActions } from '../../files/files.slice'
import { createLogger } from '../../../utils/logger'
import { getProfilePhotoSource } from './userProfile.utils'
import { type PayloadAction } from '@reduxjs/toolkit'

const logger = createLogger('downloadProfilePhotosSaga')

export function* downloadProfilePhotosSaga(
  action: PayloadAction<ReturnType<typeof usersActions.updateUserProfiles>['payload']>
): Generator {
  const updatedProfiles = action.payload

  logger.info(`Processing profile photo updateUserProfiles for ${updatedProfiles.length} profiles`)

  for (const profile of updatedProfiles) {
    const profilePhoto = getProfilePhotoSource(profile)

    if (profilePhoto && typeof profilePhoto === 'object' && !profilePhoto.path) {
      logger.info(`Triggering download for profile photo of user ${profile.userId}`)
      yield* put(filesActions.downloadFile(profilePhoto))
    }
  }
}
