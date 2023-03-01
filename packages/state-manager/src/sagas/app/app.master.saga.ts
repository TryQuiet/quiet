import { Socket } from 'socket.io-client'
import { all, takeEvery, takeLeading } from 'typed-redux-saga'
import { appActions } from './app.slice'
import { closeServicesSaga } from './closeServices.saga'
import { leaveCommunitySaga } from './leaveCommunity.saga'

export function* appMasterSaga(socket: Socket): Generator {
  yield* all([
    takeLeading(appActions.closeServices.type, closeServicesSaga, socket),
    takeEvery(appActions.leaveCommunity.type, leaveCommunitySaga, socket)
  ])
  yield* all([takeLeading(appActions.closeServices.type, closeServicesSaga, socket)])
}
