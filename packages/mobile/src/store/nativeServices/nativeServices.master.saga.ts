import { all, fork, takeEvery } from 'typed-redux-saga'
import { nativeServicesCallbacksSaga } from './events/nativeServicesCallbacks'
import { leaveCommunitySaga } from './leaveCommunity/leaveCommunity.saga'
import { flushPersistorSaga } from './flushPersistor/flushPersistor.saga'
import { nativeServicesActions } from './nativeServices.slice'

export function* nativeServicesMasterSaga(): Generator {
  yield all([
    fork(nativeServicesCallbacksSaga),
    takeEvery(nativeServicesActions.leaveCommunity.type, leaveCommunitySaga),
    takeEvery(nativeServicesActions.flushPersistor.type, flushPersistorSaga)
  ])
}
