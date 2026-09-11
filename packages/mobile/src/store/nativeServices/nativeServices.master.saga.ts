import { all, fork, takeEvery, cancelled } from 'typed-redux-saga'
import { nativeServicesCallbacksSaga } from './events/nativeServicesCallbacks'
import { leaveCommunitySaga } from './leaveCommunity/leaveCommunity.saga'
import { flushPersistorSaga } from './flushPersistor/flushPersistor.saga'
import { nativeServicesActions } from './nativeServices.slice'
import { createLogger } from '../../utils/logger'

const logger = createLogger('nativeServicesMaster')

export function* flushPersistorWatcherSaga(): Generator {
  yield* takeEvery(nativeServicesActions.flushPersistor.type, flushPersistorSaga)
}

export function* nativeServicesMasterSaga(): Generator {
  logger.info('nativeServicesMasterSaga starting')
  try {
    yield* fork(flushPersistorWatcherSaga)
    yield* fork(nativeServicesCallbacksSaga)
    yield all([takeEvery(nativeServicesActions.leaveCommunity.type, leaveCommunitySaga)])
  } finally {
    logger.info('nativeServicesMasterSaga stopping')
    if (yield cancelled()) {
      logger.info('nativeServicesMasterSaga cancelled')
    }
  }
}
