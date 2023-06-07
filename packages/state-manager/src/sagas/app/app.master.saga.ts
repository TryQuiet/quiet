import { Socket } from '../../types'
import { all, takeEvery, takeLeading } from 'typed-redux-saga'
import { appActions } from './app.slice'
import { closeServicesSaga } from './closeServices.saga'
import { stopBackendSaga } from './stopBackend/stopBackend.saga'

export function* appMasterSaga(socket: Socket): Generator {
  yield* all([
    takeLeading(appActions.closeServices.type, closeServicesSaga, socket),
    takeEvery(appActions.stopBackend.type, stopBackendSaga, socket)
  ])
}
