import { Socket } from '../../types'
import { all, takeLeading } from 'typed-redux-saga'
import { appActions } from './app.slice'
import { closeServicesSaga } from './closeServices.saga'

export function* appMasterSaga(socket: Socket): Generator {
  yield* all([takeLeading(appActions.closeServices.type, closeServicesSaga, socket)])
}
