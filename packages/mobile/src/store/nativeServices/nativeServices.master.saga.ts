import { all, fork, takeEvery } from 'typed-redux-saga';
import { createDataDirectorySaga } from './createDataDirectory/createDataDirectory.saga';
import { nativeServicesActions } from './nativeServices.slice';
import { nativeServicesCallbacksSaga } from './nativeServicesCallbacks/nativeServicesCallbacks';
import { pushNotificationsSaga } from './pushNotifications/pushNotifications.saga';
import { startTorSaga } from './startTor/startTor.saga';
import { startWaggleSaga } from './startWaggle/startWaggle.saga';

export function* nativeServicesMasterSaga(): Generator {
  yield all([
    fork(nativeServicesCallbacksSaga),
    fork(createDataDirectorySaga),
    /* Starting Tor is obligatory and should be performed
    at the very beginning of the app lifecycle */
    fork(startTorSaga),
    /* Starting Waggle depends on two asynchronous tasks. It will wait
    for all neccessary values to be initialized before running nodejs process */
    fork(startWaggleSaga),
    takeEvery(
      nativeServicesActions.initPushNotifications.type,
      pushNotificationsSaga,
    ),
  ]);
}
