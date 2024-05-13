import { Socket } from '../../types'
import { all, takeEvery, takeLeading, cancelled } from 'typed-redux-saga'
import { appActions } from './app.slice'
import { closeServicesSaga } from './closeServices.saga'
import { stopBackendSaga } from './stopBackend/stopBackend.saga'
import { loadMigrationDataSaga } from './loadMigrationData/loadMigrationData.saga'

export function* appMasterSaga(socket: Socket): Generator {
  console.log('appMasterSaga starting')
  try {
    yield* all([
      takeLeading(appActions.closeServices.type, closeServicesSaga, socket),
      takeEvery(appActions.stopBackend.type, stopBackendSaga, socket),
      takeEvery(appActions.loadMigrationData.type, loadMigrationDataSaga, socket),
    ])
  } finally {
    console.log('appMasterSaga stopping')
    if (yield cancelled()) {
      console.log('appMasterSaga cancelled')
    }
  }
}
