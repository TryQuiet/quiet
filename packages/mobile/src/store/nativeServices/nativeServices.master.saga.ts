import { all, fork } from 'typed-redux-saga'
import { nativeServicesCallbacksSaga } from './events/nativeServicesCallbacks'

export function* nativeServicesMasterSaga(): Generator {
  yield all([
    fork(nativeServicesCallbacksSaga)
  ])
}
