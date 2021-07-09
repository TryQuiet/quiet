import { combineReducers } from '@reduxjs/toolkit';
import { expectSaga } from 'redux-saga-test-plan';
import { call } from 'redux-saga-test-plan/matchers';
import { ScreenNames } from '../../../const/ScreenNames.enum';
import { navigateTo } from '../../../utils/functions/navigateTo/navigateTo';
import { StoreKeys } from '../../store.keys';
import {
  identityActions,
  identityReducer,
  IdentityState,
} from '../identity.slice';
import { handleIdentityError } from './handleIdentityError.saga';

describe('handleIdentityErrorSaga', () => {
  test('navigate to error screen', () => {
    expectSaga(
      handleIdentityError,
      identityActions.throwIdentityError('message'),
    )
      .withReducer(combineReducers({ [StoreKeys.Identity]: identityReducer }), {
        [StoreKeys.Identity]: {
          ...new IdentityState(),
        },
      })
      .provide([[call.fn(navigateTo), null]])
      .call(navigateTo, ScreenNames.ErrorScreen)
      .run();
  });
});
