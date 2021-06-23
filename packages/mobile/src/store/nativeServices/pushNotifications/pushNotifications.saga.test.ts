import { combineReducers } from '@reduxjs/toolkit';
import { expectSaga } from 'redux-saga-test-plan';
import { call } from 'redux-saga-test-plan/matchers';
import { StoreKeys } from '../../store.keys';
import {
  nativeServicesReducer,
  NativeServicesState,
} from '../nativeServices.slice';

import {
  initPushNotifications,
  pushNotificationsSaga,
} from './pushNotifications.saga';

describe('pushNotificationsSaga', () => {
  test('init push notifications for android', () => {
    expectSaga(pushNotificationsSaga)
      .withReducer(
        combineReducers({ [StoreKeys.NativeServices]: nativeServicesReducer }),
        {
          [StoreKeys.NativeServices]: {
            ...new NativeServicesState(),
          },
        },
      )
      .provide([[call(initPushNotifications), null]])
      .call(initPushNotifications)
      .run();
  });
});
