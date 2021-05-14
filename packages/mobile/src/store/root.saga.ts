import {all, fork} from 'typed-redux-saga';

import {sessionMasterSaga} from './session/session.master.saga';

export function* rootSaga(): Generator {
  yield all([fork(sessionMasterSaga)]);
}
