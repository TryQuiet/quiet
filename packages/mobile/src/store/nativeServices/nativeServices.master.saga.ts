import { all, fork, takeEvery, cancelled } from 'typed-redux-saga'
import { nativeServicesCallbacksSaga } from './events/nativeServicesCallbacks'
import { leaveCommunitySaga } from './leaveCommunity/leaveCommunity.saga'
import { flushPersistorSaga } from './flushPersistor/flushPersistor.saga'
import { nativeServicesActions } from './nativeServices.slice'
import { createLogger } from '../../utils/logger'

const logger = createLogger('nativeServicesMaster')

export function* nativeServicesMasterSaga(): Generator {
  logger.info('nativeServicesMasterSaga starting')
  try {
    yield all([
      fork(nativeServicesCallbacksSaga),
      takeEvery(nativeServicesActions.leaveCommunity.type, leaveCommunitySaga),
      takeEvery(nativeServicesActions.flushPersistor.type, flushPersistorSaga),
    ])
  } finally {
    logger.info('nativeServicesMasterSaga stopping')
    if (yield cancelled()) {
      logger.info('nativeServicesMasterSaga cancelled')
    }
  }
}
