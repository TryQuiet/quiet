import { combineReducers } from '@reduxjs/toolkit';
import { expectSaga } from 'redux-saga-test-plan';
import { StoreKeys } from '../../store.keys';
import {
  nativeServicesReducer,
  NativeServicesState,
} from '../nativeServices.slice';

import { pushNotificationsSaga } from './pushNotifications.saga';

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
      .run();
  });
});
