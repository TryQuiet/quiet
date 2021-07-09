import { combineReducers } from '@reduxjs/toolkit';
import { expectSaga } from 'redux-saga-test-plan';
import { Socket } from 'socket.io-client';
import { StoreKeys } from '../../store.keys';
import {
  identityActions,
  identityReducer,
  IdentityState,
} from '../identity.slice';
import { registerUsernameSaga } from './registerUsername.saga';
describe('registerUsernameSaga', () => {
  test('create user csr', () => {
    const socket = { emit: jest.fn() } as unknown as Socket;
    expectSaga(
      registerUsernameSaga,
      socket,
      identityActions.registerUsername('username'),
    )
      .withReducer(combineReducers({ [StoreKeys.Identity]: identityReducer }), {
        [StoreKeys.Identity]: {
          ...new IdentityState(),
          commonName: 'commonName',
          peerId: 'peerId',
        },
      })
      .put(
        identityActions.createUserCsr({
          zbayNickname: 'username',
          commonName: 'commonName',
          peerId: 'peerId',
        }),
      )
      .run();
  });
  test('throw error if missing data', () => {
    const socket = { emit: jest.fn() } as unknown as Socket;
    expectSaga(
      registerUsernameSaga,
      socket,
      identityActions.registerUsername('username'),
    )
      .withReducer(combineReducers({ [StoreKeys.Identity]: identityReducer }), {
        [StoreKeys.Identity]: {
          ...new IdentityState(),
        },
      })
      .put(
        identityActions.throwIdentityError(
          "You're not connected with other peers.",
        ),
      )
      .run();
  });
});
