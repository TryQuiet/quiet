import { all, takeEvery } from 'typed-redux-saga';
import { assetsMasterSaga } from './assets/assets.master.saga';
import { initActions } from './init/init.slice';
import { deviceEventsMasterSaga } from './nativeServices/deviceEventEmmiter/nativeServicesCallbacks';
import { socketMasterSaga } from './socket/socket.master.saga';

export function* rootSaga(): Generator {
  yield all([
    takeEvery(initActions.setStoreReady.type, deviceEventsMasterSaga),
    takeEvery(initActions.setStoreReady.type, assetsMasterSaga),
    takeEvery(initActions.setStoreReady.type, socketMasterSaga),
  ]);
}
