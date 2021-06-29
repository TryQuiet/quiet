import { combineReducers } from '@reduxjs/toolkit';
import { expectSaga } from 'redux-saga-test-plan';
import { call } from 'redux-saga-test-plan/matchers';
import { navigateTo } from '../../../utils/functions/navigateTo/navigateTo';
import { StoreKeys } from '../../store.keys';
import { initReducer, InitState } from '../init.slice';
import { waitForNavigatorSaga } from './waitForNavigator.saga';

describe('waitForNavigatorSaga', () => {
  test('should be defined', async () => {
    await expectSaga(waitForNavigatorSaga)
      .withReducer(combineReducers({ [StoreKeys.Init]: initReducer }), {
        [StoreKeys.Init]: {
          ...new InitState(),
          isNavigatorReady: true,
        },
      })
      .provide([[call.fn(navigateTo), null]])
      .run();
  });
});
