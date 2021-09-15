import { Socket } from 'socket.io-client';
import { PayloadAction } from '@reduxjs/toolkit';
import { fork, call, put, take, apply } from 'typed-redux-saga';
import { eventChannel } from 'redux-saga';
import { identityActions } from '../identity.slice';
import {communitiesActions} from '../../communities/communities.slice'
import {errorsActions} from '../../errors/errors.slice'
import { SocketActionTypes } from '../../socket/const/actionTypes';

export function* registerCertificateSaga(
  socket: Socket,
  action: PayloadAction<
    ReturnType<typeof identityActions.storeUserCsr>['payload']
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
    | ReturnType<typeof communitiesActions.storePeerList>
  >((emit) => {
    socket.on(
      SocketActionTypes.SEND_USER_CERTIFICATE,
      (payload: {id: string, payload: {peers: string[], certificate: string}}) => {
        emit(communitiesActions.storePeerList({communityId: payload.id, peerList: payload.payload.peers}))
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
  })};
