import { all, call, take, takeEvery, takeLeading, fork, cancelled } from 'typed-redux-saga'
import { nativeServicesMasterSaga } from './nativeServices/nativeServices.master.saga'
import { navigationMasterSaga } from './navigation/navigation.master.saga'
import { initMasterSaga } from './init/init.master.saga'
import { initActions } from './init/init.slice'
import { publicChannels } from '@quiet/state-manager'
import { showNotificationSaga } from './nativeServices/showNotification/showNotification.saga'
import { clearReduxStore } from './nativeServices/leaveCommunity/leaveCommunity.saga'
import { setEngine, CryptoEngine } from 'pkijs'

const initCryptoEngine = () => {
  setEngine(
    'newEngine',
    new CryptoEngine({
      name: '',
      crypto,
      subtle: crypto.subtle,
    })
  )
}

export function* rootSaga(): Generator {
  console.log('rootSaga starting')
  try {
    console.log('Initializing crypto engine')
    yield* call(initCryptoEngine)
    // We don't want to start any sagas until the store is ready in
    // case they use the store. Currently, we run these sagas once per
    // application lifecycle. However, when we leave the community and
    // clear the Redux store, if the Redux store is cleared while a
    // saga is running, I suppose there is a possibility of corrupted
    // state. Perhaps, it would make more sense to stop this saga,
    // clear the store and then restart it, but that requires some
    // refactoring.
    yield* take(initActions.setStoreReady)
    yield* call(storeReadySaga)
  } finally {
    console.log('rootSaga stopping')
    if (yield cancelled()) {
      console.log('rootSaga cancelled')
    }
  }
}

function* storeReadySaga(): Generator {
  console.log('storeReadySaga starting')
  try {
    yield all([
      fork(initMasterSaga),
      fork(navigationMasterSaga),
      fork(nativeServicesMasterSaga),
      // Below line is reponsible for displaying notifications about messages from channels other than currently viewing one
      takeEvery(publicChannels.actions.markUnreadChannel.type, showNotificationSaga),
      takeLeading(initActions.canceledRootTask.type, clearReduxStore),
    ])
  } finally {
    console.log('storeReadySaga stopping')
    if (yield cancelled()) {
      console.log('storeReadySaga cancelled')
    }
  }
}
