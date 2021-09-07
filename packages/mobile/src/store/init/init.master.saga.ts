import { all, takeEvery } from 'typed-redux-saga';
import { doOnRestoreSaga } from './doOnRestore/doOnRestore.saga';
import { initActions } from './init.slice';
import { startConnectionSaga } from './startConnection/startConnection.saga';

export function* initMasterSaga(): Generator {
  yield all([
    takeEvery(initActions.doOnRestore.type, doOnRestoreSaga),
    takeEvery(initActions.onWaggleStarted.type, startConnectionSaga),
  ]);
}
