import { Socket } from 'socket.io-client';
import { PayloadAction } from '@reduxjs/toolkit';
import { fork, call, put, take, apply } from 'typed-redux-saga';
import { eventChannel } from 'redux-saga';
import { identityActions } from '../identity.slice';
import {errorsActions} from '../../errors/errors.slice'
import { SocketActionTypes } from '../../socket/const/actionTypes';

export function* registerCertificateSaga(
  socket: Socket,
  action: PayloadAction<
    ReturnType<any>['payload']
  >
): Generator {
  yield* fork(handleCertificateActions, socket);
  yield* apply(socket, socket.emit, [
    SocketActionTypes.REGISTER_USER_CERTIFICATE,
    action.payload.registrarAddress,
    action.payload.userCsr.userCsr,
    action.payload.communityId,
  ]);
}

export function* handleCertificateActions(socket: Socket): Generator {
  const socketChannel = yield* call(subscribe, socket);
  while (true) {
    const action = yield* take(socketChannel);
    yield put(action);
  }
}

export function subscribe(socket: Socket) {
  return eventChannel<
    | ReturnType<typeof identityActions.storeUserCertificate>
    | ReturnType<typeof identityActions.throwIdentityError>
  >((emit) => {
    socket.on(
      SocketActionTypes.SEND_USER_CERTIFICATE,
      (payload: any) => {
        console.log('storeUserCertificate')
        console.log(payload)
        emit(identityActions.storeUserCertificate({userCertificate: payload.payload.certificate, communityId: payload.id}));
      }
    );
    socket.on(
      SocketActionTypes.CERTIFICATE_REGISTRATION_ERROR,
      (message: string) => {
        emit(errorsActions.certificateRegistration(message));
      }
    );
    return () => {};
  });
}