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
  test('send certificate request to waggle', async () => {
    const socket = { emit: jest.fn(), on: jest.fn() } as unknown as Socket;
    const userCsr = {
      userCsr: 'userCsr',
      userKey: 'userKey',
      pkcs10: jest.fn(),
    };
    await expectSaga(
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
        'http://wzispgrbrrkt3bari4kljpqz2j6ozzu3vlsoi2wqupgu7ewi4ncibrid.onion:7789',
        userCsr,
      ])
      .silentRun();
  });
});
