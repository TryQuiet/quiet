import { all, takeEvery } from 'typed-redux-saga';
import { initMasterSaga } from './init/init.master.saga';
import { initActions } from './init/init.slice';
import { nativeServicesMasterSaga } from './nativeServices/nativeServices.master.saga';
import { assetsMasterSaga } from './assets/assets.master.saga';
import { socketMasterSaga } from './socket/socket.master.saga';

export function* rootSaga(): Generator {
  yield all([
    takeEvery(initActions.setStoreReady.type, initMasterSaga),
    takeEvery(initActions.setStoreReady.type, nativeServicesMasterSaga),
    takeEvery(initActions.setStoreReady.type, assetsMasterSaga),
    takeEvery(initActions.setStoreReady.type, socketMasterSaga),
  ]);
}
