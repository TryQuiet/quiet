import { all, fork, cancelled } from 'typed-redux-saga'
import { uptimeSaga } from './uptime/uptime.saga'
import { createLogger } from '../../utils/logger'

const logger = createLogger('connectionMasterSaga')

export function* connectionMasterSaga(): Generator {
  logger.info('connectionMasterSaga starting')
  try {
    yield all([fork(uptimeSaga)])
  } finally {
    logger.info('connectionMasterSaga stopping')
    if (yield cancelled()) {
      logger.info('connectionMasterSaga cancelled')
    }
  }
}
