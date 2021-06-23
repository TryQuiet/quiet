import { all, fork, takeEvery } from 'redux-saga/effects';
import { deviceEventsSaga } from './deviceEventEmmiter/nativeServicesCallbacks';
import { nativeServicesActions } from './nativeServices.slice';
import { pushNotificationsSaga } from './pushNotifications/pushNotifications.saga';

export function* nativeServicesMasterSaga(): Generator {
  yield all([
    fork(deviceEventsSaga),
    takeEvery(
      nativeServicesActions.initPushNotifications,
      pushNotificationsSaga,
    ),
  ]);
}
