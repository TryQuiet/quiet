import {all, fork} from 'typed-redux-saga';

import {testStoreMasterSaga} from './testStore/testStore.master.saga';

export function* rootSaga(): Generator {
  yield all([fork(testStoreMasterSaga)]);
}
