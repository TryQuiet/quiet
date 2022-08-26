import { all, fork } from 'typed-redux-saga'
import { createDataDirectorySaga } from './createDataDirectory/createDataDirectory.saga'
import { nativeServicesCallbacksSaga } from './nativeServicesCallbacks/nativeServicesCallbacks'
import { startTorSaga } from './startTor/startTor.saga'
import { startBackendSaga } from './startBackend/startBackend.saga'

export function* nativeServicesMasterSaga(): Generator {
  yield all([
    fork(nativeServicesCallbacksSaga),
    fork(createDataDirectorySaga),
    /* Starting Tor is obligatory and should be performed
    at the very beginning of the app lifecycle */
    fork(startTorSaga),
    /* Starting Backend depends on two asynchronous tasks. It will wait
    for all neccessary values to be initialized before running nodejs process */
    fork(startBackendSaga)
  ])
}
