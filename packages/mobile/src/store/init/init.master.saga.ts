import { all, takeEvery } from 'typed-redux-saga'
import { initActions } from './init.slice'
import { doOnRestoreSaga } from './doOnRestore/doOnRestore.saga'
import { startConnectionSaga } from './startConnection/startConnection.saga'
import { saveDataDirectorySaga } from '../nativeServices/saveDataDirectory/saveDataDirectorySaga'
import { saveDataPortSaga } from '../nativeServices/saveDataPort/saveDataPortSaga'

export function* initMasterSaga(): Generator {
  yield all([
    takeEvery(initActions.doOnRestore.type, doOnRestoreSaga),
    takeEvery(initActions.onDataDirectoryCreated.type, saveDataDirectorySaga),
    takeEvery(initActions.onBackendStarted.type, saveDataPortSaga),
    takeEvery(initActions.onBackendStarted.type, startConnectionSaga),
  ])
}
