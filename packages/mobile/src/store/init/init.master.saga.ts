import { all, takeEvery } from 'typed-redux-saga';
import { doOnRestoreSaga } from './doOnRestore/doOnRestore.saga';
import { initActions } from './init.slice';

export function* initMasterSaga(): Generator {
  yield all([takeEvery(initActions.doOnRestore.type, doOnRestoreSaga)]);
}
