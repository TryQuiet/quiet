import { combineReducers } from '@reduxjs/toolkit';
import { expectSaga } from 'redux-saga-test-plan';
import { call } from 'redux-saga-test-plan/matchers';
import { initActions } from '../../init/init.slice';
import { NativeModules } from 'react-native';
import { StoreKeys } from '../../store.keys';
import {
  nativeServicesReducer,
  NativeServicesState,
} from '../nativeServices.slice';

import { startTorSaga } from './startTor.saga';

describe('startTorSaga', () => {
  test('should start tor with native method', () => {
    NativeModules.TorModule = {
      startTor: jest.fn(),
    };
    expectSaga(startTorSaga)
      .withReducer(
        combineReducers({ [StoreKeys.NativeServices]: nativeServicesReducer }),
        {
          [StoreKeys.NativeServices]: {
            ...new NativeServicesState(),
          },
        },
      )
      .put(initActions.updateInitDescription('Tor initialization in progress'))
      .call(NativeModules.TorModule.startTor)
      .run();
  });
});
