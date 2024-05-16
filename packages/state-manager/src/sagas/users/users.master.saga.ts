import { takeEvery, cancelled } from 'redux-saga/effects'
import { all } from 'typed-redux-saga'
import { type Socket } from '../../types'
import { usersActions } from './users.slice'
import { saveUserProfileSaga } from './userProfile/saveUserProfile.saga'
import { createLogger } from '../../utils/logger'

const logger = createLogger('usersMasterSaga')

export function* usersMasterSaga(socket: Socket): Generator {
  logger.info('usersMasterSaga starting')
  try {
    yield all([takeEvery(usersActions.saveUserProfile.type, saveUserProfileSaga, socket)])
  } finally {
    logger.info('usersMasterSaga stopping')
    if (yield cancelled()) {
      logger.info('usersMasterSaga cancelled')
    }
  }
}
