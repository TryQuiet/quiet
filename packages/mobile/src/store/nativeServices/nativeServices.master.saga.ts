import { all, fork, takeEvery } from 'redux-saga/effects';
import { nativeServicesActions } from './nativeServices.slice';
import { nativeServicesCallbacksSaga } from './nativeServicesCallbacks/nativeServicesCallbacks';
import { pushNotificationsSaga } from './pushNotifications/pushNotifications.saga';
import { startTorSaga } from './startTor/startTor.saga';
import { startWaggleSaga } from './startWaggle/startWaggle.saga';

export function* nativeServicesMasterSaga(): Generator {
  yield all([
    fork(nativeServicesCallbacksSaga),
    /* Starting Tor is obligatory and should be performed
    at the very beginning of app lifecycle */
    fork(startTorSaga),
    takeEvery(nativeServicesActions.startWaggle.type, startWaggleSaga),
    takeEvery(
      nativeServicesActions.initPushNotifications.type,
      pushNotificationsSaga,
    ),
  ]);
}
