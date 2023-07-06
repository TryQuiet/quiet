import { all, takeEvery, fork } from 'typed-redux-saga'
import { nativeServicesMasterSaga } from './nativeServices/nativeServices.master.saga'
import { navigationMasterSaga } from './navigation/navigation.master.saga'
import { initMasterSaga } from './init/init.master.saga'
import { initActions } from './init/init.slice'
import { setupCryptoSaga } from './init/setupCrypto/setupCrypto.saga'
import { publicChannels } from '@quiet/state-manager'
import { showNotificationSaga } from './nativeServices/showNotification/showNotification.saga'
import { restoreConnectionSaga } from './init/startConnection/restoreConnection/restoreConnection.saga'

export function* rootSaga(): Generator {
  yield all([
    takeEvery(initActions.setStoreReady.type, setupCryptoSaga),
    takeEvery(initActions.setStoreReady.type, initMasterSaga),
    takeEvery(initActions.setStoreReady.type, navigationMasterSaga),
    takeEvery(initActions.setStoreReady.type, nativeServicesMasterSaga),
    fork(restoreConnectionSaga),
    // Below line is reponsible for displaying notifications about messages from channels other than currently viewing one
    takeEvery(publicChannels.actions.markUnreadChannel.type, showNotificationSaga),
  ])
}
