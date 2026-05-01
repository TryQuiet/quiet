import { Socket } from '../../types'
import { all, takeEvery, takeLeading, cancelled, put } from 'typed-redux-saga'
import { appActions } from './app.slice'
import { closeServicesSaga } from './closeServices.saga'
import { stopBackendSaga } from './stopBackend/stopBackend.saga'
import { loadMigrationDataSaga } from './loadMigrationData/loadMigrationData.saga'
import { createLogger } from '../../utils/logger'
import { publicChannelsActions } from '../publicChannels/publicChannels.slice'

const logger = createLogger('appMasterSaga')

export function* appMasterSaga(socket: Socket): Generator {
  logger.info('appMasterSaga starting')
  try {
    yield* all([
      takeLeading(appActions.closeServices.type, closeServicesSaga, socket),
      takeEvery(appActions.stopBackend.type, stopBackendSaga, socket),
      takeEvery(appActions.loadMigrationData.type, loadMigrationDataSaga, socket),
    ])
  } finally {
    logger.info('appMasterSaga stopping')
    if (yield cancelled()) {
      logger.info('appMasterSaga cancelled')
    }
  }
}
