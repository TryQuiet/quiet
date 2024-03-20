import { Socket } from '../../types'
import { all, takeEvery, takeLeading } from 'typed-redux-saga'
import { appActions } from './app.slice'
import { closeServicesSaga } from './closeServices.saga'
import { stopBackendSaga } from './stopBackend/stopBackend.saga'
import { loggingHandler, LoggerModuleName } from '../../utils/logger'

const LOGGER = loggingHandler.initLogger([LoggerModuleName.APP, LoggerModuleName.SAGA, LoggerModuleName.MASTER])

export function* appMasterSaga(socket: Socket): Generator {
  LOGGER.info(`Stopping app, closing services and stopping backend`)
  yield* all([
    takeLeading(appActions.closeServices.type, closeServicesSaga, socket),
    takeEvery(appActions.stopBackend.type, stopBackendSaga, socket),
  ])
}
