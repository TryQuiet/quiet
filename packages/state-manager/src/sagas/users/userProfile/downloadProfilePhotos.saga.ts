import { select, put, takeEvery } from 'typed-redux-saga'
import { usersActions } from '../users.slice'
import { filesActions } from '../../files/files.slice'
import { DownloadState } from '@quiet/types'
import { createLogger } from '../../../utils/logger'
import { getProfilePhotoSource } from './userProfile.utils'
import { type PayloadAction } from '@reduxjs/toolkit'

const logger = createLogger('downloadProfilePhotosSaga')

export function* downloadProfilePhotosSaga(): Generator {
  logger.info('downloadProfilePhotosSaga starting')

  yield takeEvery(
    usersActions.updateUserProfiles.type,
    function* (action: PayloadAction<ReturnType<typeof usersActions.updateUserProfiles>['payload']>) {
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
  )
}
