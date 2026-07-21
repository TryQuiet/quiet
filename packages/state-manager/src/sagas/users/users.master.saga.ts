import { takeEvery, cancelled } from 'redux-saga/effects'
import { all } from 'typed-redux-saga'
import { type Socket } from '../../types'
import { usersActions } from './users.slice'
import { saveUserProfileSaga } from './userProfile/saveUserProfile.saga'
import { downloadProfilePhotosSaga } from './userProfile/downloadProfilePhotos.saga'
import { createLogger } from '../../utils/logger'
import { updateUserProfilesSaga } from './userProfile/updateUserProfiles.saga'
import { respondCachedUserProfileSaga } from './userProfile/respondCachedUserProfile.saga'

const logger = createLogger('usersMasterSaga')

export function* usersMasterSaga(socket: Socket): Generator {
  logger.info('usersMasterSaga starting')
  try {
    yield all([
      takeEvery(usersActions.saveUserProfile.type, saveUserProfileSaga, socket),
      takeEvery(usersActions.updateUserProfiles.type, updateUserProfilesSaga, socket),
      takeEvery(usersActions.updateUserProfiles.type, downloadProfilePhotosSaga),
      takeEvery(usersActions.cachedUserProfileRequested.type, respondCachedUserProfileSaga),
    ])
  } finally {
    logger.info('usersMasterSaga stopping')
    if (yield cancelled()) {
      logger.info('usersMasterSaga cancelled')
    }
  }
}
