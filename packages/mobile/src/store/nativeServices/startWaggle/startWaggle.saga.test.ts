
import { combineReducers } from '@reduxjs/toolkit';
import { expectSaga } from 'redux-saga-test-plan';
import { StoreKeys } from '../../store.keys';
import { nativeServicesReducer, NativeServicesState } from '../nativeServices.slice';
import { startWaggleSaga } from './startWaggle.saga';
describe('startWaggleSaga', () => {
  test('should be defined', () => {
    expectSaga(startWaggleSaga)
      .withReducer(combineReducers({ [StoreKeys.NativeServices]: nativeServicesReducer }), {
        [StoreKeys.NativeServices]: {
          ...new NativeServicesState(),
        },
      })
      .hasFinalState({
        [StoreKeys.NativeServices]: {
          ...new NativeServicesState(),
        },
      })
      .run();
  });
});
