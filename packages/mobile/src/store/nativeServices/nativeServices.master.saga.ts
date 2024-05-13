import { all, fork, takeEvery, cancelled } from 'typed-redux-saga'
import { nativeServicesCallbacksSaga } from './events/nativeServicesCallbacks'
import { leaveCommunitySaga } from './leaveCommunity/leaveCommunity.saga'
import { flushPersistorSaga } from './flushPersistor/flushPersistor.saga'
import { nativeServicesActions } from './nativeServices.slice'

export function* nativeServicesMasterSaga(): Generator {
  console.log('nativeServicesMasterSaga starting')
  try {
    yield all([
      fork(nativeServicesCallbacksSaga),
      takeEvery(nativeServicesActions.leaveCommunity.type, leaveCommunitySaga),
      takeEvery(nativeServicesActions.flushPersistor.type, flushPersistorSaga),
    ])
  } finally {
    console.log('nativeServicesMasterSaga stopping')
    if (yield cancelled()) {
      console.log('nativeServicesMasterSaga cancelled')
    }
  }
}
