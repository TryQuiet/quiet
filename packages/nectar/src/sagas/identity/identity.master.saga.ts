import { Socket } from 'socket.io-client';
import { all, takeEvery } from 'typed-redux-saga';
import { createUserCsrSaga } from './createUserCsr/createUserCsr.saga';
import { identityActions } from './identity.slice';
import { registerCertificateSaga } from './registerCertificate/registerCertificate.saga';
import { registerUsernameSaga } from './registerUsername/registerUsername.saga';

export function* identityMasterSaga(socket: Socket): Generator {
  yield all([
    takeEvery(identityActions.registerUsername.type, registerUsernameSaga),
    takeEvery(identityActions.createUserCsr.type, createUserCsrSaga),
    takeEvery(
      identityActions.storeUserCsr.type,
      registerCertificateSaga,
      socket
    )
  ]);
}