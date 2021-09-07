import { combineReducers } from '@reduxjs/toolkit';
import { expectSaga } from 'redux-saga-test-plan';
import { call } from 'redux-saga-test-plan/matchers';
import { initActions, initReducer, InitState } from '../../init/init.slice';
import { StoreKeys } from '../../store.keys';
import {
  nativeServicesReducer,
  NativeServicesState,
} from '../nativeServices.slice';

import { startNodeProcess, startWaggleSaga } from './startWaggle.saga';

describe('startWaggleSaga', () => {
  test('should start nodejs process', () => {
    expectSaga(startWaggleSaga)
      .withReducer(
        combineReducers({
          [StoreKeys.NativeServices]: nativeServicesReducer,
          [StoreKeys.Init]: initReducer,
        }),
        {
          [StoreKeys.NativeServices]: {
            ...new NativeServicesState(),
          },
          [StoreKeys.Init]: {
            ...new InitState(),
            dataDirectoryPath: 'dataDirectoryPath',
            torData: {
              socksPort: 9010,
              controlPort: 9150,
              authCookie: 'cookie',
            },
          },
        },
      )
      .provide([[call.fn(startNodeProcess), null]])
      .put(
        initActions.updateInitDescription(
          'Data is being retrieved from a distributed database',
        ),
      )
      .put(initActions.onWaggleStarted(true))
      .call(startNodeProcess, 'dataDirectoryPath', 9010, 9150, 'cookie')
      .run();
  });
});
