import { io, Socket } from 'socket.io-client';
import { fork } from 'redux-saga/effects';
import { all, call, delay, put, take } from 'typed-redux-saga';
import config from '../config';
import { eventChannel } from 'redux-saga';
import { SocketActionTypes } from '../const/actionTypes';
import { publicChannelsActions } from '../../publicChannels/publicChannels.slice';
import { publicChannelsMasterSaga } from '../../publicChannels/publicChannels.master.saga';
import { socketActions } from '../socket.slice';
import { initActions } from '../../init/init.slice';
import { InitCheckKeys } from '../../init/initCheck.keys';
import { assetsActions } from '../../assets/assets.slice';

export function* startConnectionSaga(): Generator {
  const socket = yield* call(connect);
  yield* put(socketActions.setConnected(true));
  yield* put(
    assetsActions.setDownloadHint('Replicating data from distributed database'),
  );
  yield* put(
    initActions.updateInitCheck({
      event: InitCheckKeys.Websocket,
      passed: true,
    }),
  );
  yield* delay(15000); // Wait for storage to be initialized
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
    | ReturnType<typeof publicChannelsActions.responseGetPublicChannels>
    | ReturnType<typeof publicChannelsActions.responseFetchAllMessages>
  >(emit => {
    socket.on(SocketActionTypes.RESPONSE_GET_PUBLIC_CHANNELS, payload => {
      emit(publicChannelsActions.responseGetPublicChannels(payload));
    });
    socket.on(SocketActionTypes.RESPONSE_FETCH_ALL_MESSAGES, payload => {
      emit(publicChannelsActions.responseFetchAllMessages(payload));
    });
    return () => {};
  });
}
