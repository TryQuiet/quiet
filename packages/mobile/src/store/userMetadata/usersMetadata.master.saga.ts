import { takeEvery, cancelled } from 'redux-saga/effects'
import { all } from 'typed-redux-saga'
import { saveUserMetadataNativelySaga } from './saveUserMetadataNatively/saveUserMetadataNatively.saga'
import { createLogger } from '../../utils/logger'
import { usersMetadataActions } from './usersMetadata.slice'

const logger = createLogger('usersMetadataMasterSaga')

export function* usersMetadataMasterSaga(): Generator {
  logger.info('usersMetadataMasterSaga starting')
  try {
    yield all([takeEvery(usersMetadataActions.saveUserMetadataNatively.type, saveUserMetadataNativelySaga)])
  } finally {
    logger.info('usersMetadataMasterSaga stopping')
    if (yield cancelled()) {
      logger.info('usersMetadataMasterSaga cancelled')
    }
  }
}
