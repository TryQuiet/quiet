import { all, takeEvery, cancelled } from 'typed-redux-saga'
import { errorsActions } from './errors.slice'
import { handleErrorsSaga } from './handleErrors/handleErrors.saga'
import { createLogger } from '../../utils/logger'

const logger = createLogger('errorsMasterSaga')

export function* errorsMasterSaga(): Generator {
  logger.info('errorsMasterSaga starting')
  try {
    yield all([takeEvery(errorsActions.handleError.type, handleErrorsSaga)])
  } finally {
    logger.info('errorsMasterSaga stopping')
    if (yield cancelled()) {
      logger.info('errorsMasterSaga cancelled')
    }
  }
}
