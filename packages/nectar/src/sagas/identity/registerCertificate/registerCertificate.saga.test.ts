import { expectSaga } from 'redux-saga-test-plan';
import { Socket } from 'socket.io-client';
import { SocketActionTypes } from '../../socket/const/actionTypes';
import {
  identityActions,
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
    const communityId = 'id'
    const registrarAddress = 'http://wzispgrbrrkt3bari4kljpqz2j6ozzu3vlsoi2wqupgu7ewi4ncibrid.onion:7789'
    await expectSaga(
      registerCertificateSaga,
      socket,
      identityActions.storeUserCsr(<{userCsr: UserCsr, communityId: 'string',registrarAddress: string}>(<unknown>{ registrarAddress, userCsr, communityId }))
    )
      .apply(socket, socket.emit, [
        SocketActionTypes.REGISTER_USER_CERTIFICATE,
        'http://wzispgrbrrkt3bari4kljpqz2j6ozzu3vlsoi2wqupgu7ewi4ncibrid.onion:7789',
        userCsr.userCsr,
        communityId
      ])
      .silentRun();
  });
});
