import { all, takeEvery, takeLeading, fork, cancelled } from 'typed-redux-saga'
import { nativeServicesMasterSaga } from './nativeServices/nativeServices.master.saga'
import { navigationMasterSaga } from './navigation/navigation.master.saga'
import { initMasterSaga } from './init/init.master.saga'
import { initActions } from './init/init.slice'
import { setupCryptoSaga } from './init/setupCrypto/setupCrypto.saga'
import { publicChannels } from '@quiet/state-manager'
import { showNotificationSaga } from './nativeServices/showNotification/showNotification.saga'
import { clearReduxStore } from './nativeServices/leaveCommunity/leaveCommunity.saga'

export function* rootSaga(): Generator {
  console.log('rootSaga starting')
  try {
    yield all([
      fork(setupCryptoSaga),
      fork(initMasterSaga),
      fork(navigationMasterSaga),
      fork(nativeServicesMasterSaga),
      // Below line is reponsible for displaying notifications about messages from channels other than currently viewing one
      takeEvery(publicChannels.actions.markUnreadChannel.type, showNotificationSaga),
      takeLeading(initActions.canceledRootTask.type, clearReduxStore),
    ])
  } finally {
    console.log('rootSaga stopping')
    if (yield cancelled()) {
      console.log('rootSaga cancelled')
    }
  }
}
