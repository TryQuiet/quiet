import { all, takeEvery } from 'typed-redux-saga'
import { initActions } from './init.slice'
import { onRestoreSaga } from './onRestore/onRestore.saga'

export function* initMasterSaga(): Generator {
  yield all([
    takeEvery(initActions.onRestore.type, onRestoreSaga)
  ])
}
