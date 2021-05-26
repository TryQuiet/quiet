import {all, fork} from 'typed-redux-saga';

import {nativeServicesMasterSaga} from './nativeServices/nativeServices.master.saga';
import {socketMasterSaga} from './socket/socket.master.saga';

export function* rootSaga(): Generator {
  yield all([fork(nativeServicesMasterSaga), fork(socketMasterSaga)]);
}
