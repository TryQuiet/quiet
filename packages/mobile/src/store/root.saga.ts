import { all, takeEvery } from 'typed-redux-saga'
import { nativeServicesMasterSaga } from './nativeServices/nativeServices.master.saga'
import { initMasterSaga } from './init/init.master.saga'
import { initActions } from './init/init.slice'
import { setupCryptoSaga } from './init/setupCrypto/setupCrypto.saga'
import { publicChannels } from '@quiet/state-manager'
import { showNotificationSaga } from './nativeServices/showNotification/showNotification.saga'

export function* rootSaga(): Generator {
  yield all([
    takeEvery(initActions.setStoreReady.type, nativeServicesMasterSaga),
    takeEvery(initActions.setStoreReady.type, initMasterSaga),
    takeEvery(initActions.setStoreReady.type, setupCryptoSaga),
    takeEvery(publicChannels.actions.markUnreadChannel.type, showNotificationSaga),
  ])
}
