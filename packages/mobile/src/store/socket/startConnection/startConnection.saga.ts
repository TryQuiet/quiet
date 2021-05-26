import {io, Socket} from 'socket.io-client';
import {fork} from 'redux-saga/effects';
import {all, call, put, take} from 'typed-redux-saga';
import config from '../config';
import {eventChannel} from 'redux-saga';
import {SocketActionTypes} from '../const/actionTypes';
import {publicChannelsActions} from '../../publicChannels/publicChannels.slice';
import {publicChannelsMasterSaga} from '../../publicChannels/publicChannels.master.saga';
import {socketActions} from '../socket.slice';
import {storageActions} from '../../storage/storage.slice';

export function* startConnectionSaga(): Generator {
  const socket = yield* call(connect);
  yield* put(socketActions.setConnected(true));
  yield fork(useIO, socket);
}

export const connect = async (): Promise<Socket> => {
  const socket = io(config.socket.address);
  return await new Promise(resolve => {
    socket.on('connect', async () => {
      resolve(socket);
    });
  });
};

export function* useIO(socket: Socket): Generator {
  yield all([
    fork(handleActions, socket),
    fork(publicChannelsMasterSaga, socket),
  ]);
}

export function* handleActions(socket: Socket): Generator {
  const socketChannel = yield* call(subscribe, socket);
  while (true) {
    const action = yield* take(socketChannel);
    yield put(action);
  }
}

export function subscribe(socket: Socket) {
  return eventChannel<
    | ReturnType<typeof storageActions.responseStorageInitialized>
    | ReturnType<typeof publicChannelsActions.responseGetPublicChannels>
    | ReturnType<typeof publicChannelsActions.responseFetchAllMessages>
  >(emit => {
    socket.on(SocketActionTypes.RESPONSE_STORAGE_INITIALIZED, payload => {
      emit(storageActions.responseStorageInitialized(payload));
    });
    socket.on(SocketActionTypes.RESPONSE_GET_PUBLIC_CHANNELS, payload => {
      emit(publicChannelsActions.responseGetPublicChannels(payload));
    });
    socket.on(SocketActionTypes.RESPONSE_FETCH_ALL_MESSAGES, payload => {
      emit(publicChannelsActions.responseFetchAllMessages(payload));
    });
    return () => {};
  });
}
