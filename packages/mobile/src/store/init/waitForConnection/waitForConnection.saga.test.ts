import { expectSaga } from 'redux-saga-test-plan';

import { combineReducers } from '@reduxjs/toolkit';
import { StoreKeys } from '../../store.keys';
import { waitForConnectionSaga } from './waitForConnection.saga';
import {
  identityActions,
  identityReducer,
  IdentityState,
} from '../../identity/identity.slice';
import { initActions, initReducer, InitState } from '../init.slice';
import { replaceScreen } from '../../../utils/functions/replaceScreen/replaceScreen';
import { call } from 'redux-saga-test-plan/matchers';
import { ScreenNames } from '../../../const/ScreenNames.enum';

describe('waitForConnectionSaga', () => {
  test('create csr', async () => {
    await expectSaga(waitForConnectionSaga)
      .withReducer(
        combineReducers({
          [StoreKeys.Init]: initReducer,
          [StoreKeys.Identity]: identityReducer,
        }),
        {
          [StoreKeys.Init]: {
            ...new InitState(),
          },
          [StoreKeys.Identity]: {
            ...new IdentityState(),
            commonName: 'commonName',
            peerId: 'peerId',
          },
        },
      )
      .provide([[call.fn(replaceScreen), null]])
      .put(identityActions.requestPeerId())
      .call(replaceScreen, ScreenNames.RegistrationScreen, {})
      .run();
  });
  test('go to main screen', async () => {
    await expectSaga(waitForConnectionSaga)
      .withReducer(
        combineReducers({
          [StoreKeys.Init]: initReducer,
          [StoreKeys.Identity]: identityReducer,
        }),
        {
          [StoreKeys.Init]: {
            ...new InitState(),
          },
          [StoreKeys.Identity]: {
            ...new IdentityState(),
            userCertificate: 'userCertificate',
          },
        },
      )
      .provide([[call.fn(replaceScreen), null]])
      .put(identityActions.requestPeerId())
      .call(replaceScreen, ScreenNames.MainScreen)
      .run();
  });
});
