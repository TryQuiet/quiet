import { combineReducers } from '@reduxjs/toolkit';
import { expectSaga } from 'redux-saga-test-plan';
import { Socket } from 'socket.io-client';
import { SocketActionTypes } from '../../socket/const/actionTypes';
import { StoreKeys } from '../../store.keys';
import {
  identityActions,
  identityReducer,
  IdentityState,
  UserCsr,
} from '../identity.slice';
import { registerCertificateSaga } from './registerCertificate.saga';
describe('registerCertificateSaga', () => {
  test('send certificate request to waggle', () => {
    const socket = { emit: jest.fn(), on: jest.fn() } as unknown as Socket;
    const userCsr = {
      userCsr: 'userCsr',
      userKey: 'userKey',
      pkcs10: jest.fn(),
    };
    expectSaga(
      registerCertificateSaga,
      socket,
      identityActions.storeUserCsr(<UserCsr>(<unknown>{ userCsr })),
    )
      .withReducer(combineReducers({ [StoreKeys.Identity]: identityReducer }), {
        [StoreKeys.Identity]: {
          ...new IdentityState(),
        },
      })
      .apply(socket, socket.emit, [
        SocketActionTypes.REGISTER_USER_CERTIFICATE,
        userCsr.userCsr,
      ])
      .run();
  });
});
