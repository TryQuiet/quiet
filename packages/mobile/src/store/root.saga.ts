import { all, takeEvery } from 'typed-redux-saga';
import { nativeServicesMasterSaga } from './nativeServices/nativeServices.master.saga';
import { initMasterSaga } from './init/init.master.saga';
import { initActions } from './init/init.slice';
import { setupCryptoSaga } from './init/setupCrypto/setupCrypto.saga';

export function* rootSaga(): Generator {
  yield all([
    takeEvery(initActions.setStoreReady.type, nativeServicesMasterSaga),
    takeEvery(initActions.setStoreReady.type, initMasterSaga),
    takeEvery(initActions.setStoreReady.type, setupCryptoSaga),
  ]);
}
