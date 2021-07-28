import { io, Socket } from 'socket.io-client';
import { all, call, put, delay, take, fork, takeEvery } from 'typed-redux-saga';
import config from '../config';
import { eventChannel } from 'redux-saga';
import { SocketActionTypes } from '../const/actionTypes';
import { nativeServicesActions } from '../../nativeServices/nativeServices.slice';
import {
  AskForMessagesResponse,
  ChannelMessagesIdsResponse,
  GetPublicChannelsResponse,
  publicChannelsActions,
} from '../../publicChannels/publicChannels.slice';
import { requestPeerIdSaga } from '../../identity/requestPeerId/requestPeerId.saga';
import { publicChannelsMasterSaga } from '../../publicChannels/publicChannels.master.saga';
import { identityActions } from '../../identity/identity.slice';
import { waitForConnectionSaga } from '../../init/waitForConnection/waitForConnection.saga';
import { identityMasterSaga } from '../../identity/identity.master.saga';
import { messagesMasterSaga } from '../../messages/messages.master.saga';
import {
  SendCertificatesResponse,
  usersActions,
} from '../../users/users.slice';
import { IMessage } from '../../publicChannels/publicChannels.types';

export function* startConnectionSaga(): Generator {
  const socket = yield* call(connect);
  yield* put(nativeServicesActions.initPushNotifications());
  yield* delay(15000); // Wait for storage to be initialized
  yield* takeEvery(
    identityActions.requestPeerId.type,
    requestPeerIdSaga,
    socket,
  );
  yield* waitForConnectionSaga();
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
    fork(messagesMasterSaga, socket),
    fork(identityMasterSaga, socket),
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
    | ReturnType<typeof identityActions.storePeerId>
    | ReturnType<typeof publicChannelsActions.responseGetPublicChannels>
    | ReturnType<typeof publicChannelsActions.responseSendMessagesIds>
    | ReturnType<typeof publicChannelsActions.responseAskForMessages>
    | ReturnType<typeof publicChannelsActions.onMessagePosted>
    | ReturnType<typeof usersActions.responseSendCertificates>
  >(emit => {
    socket.on(SocketActionTypes.SEND_PEER_ID, (payload: string) => {
      emit(identityActions.storePeerId(payload));
    });
    socket.on(
      SocketActionTypes.RESPONSE_GET_PUBLIC_CHANNELS,
      (payload: GetPublicChannelsResponse) => {
        emit(publicChannelsActions.responseGetPublicChannels(payload));
      },
    );
    socket.on(
      SocketActionTypes.SEND_MESSAGES_IDS,
      (payload: ChannelMessagesIdsResponse) => {
        emit(publicChannelsActions.responseSendMessagesIds(payload));
      },
    );
    socket.on(
      SocketActionTypes.RESPONSE_ASK_FOR_MESSAGES,
      (payload: AskForMessagesResponse) => {
        emit(publicChannelsActions.responseAskForMessages(payload));
      },
    );
    socket.on(SocketActionTypes.MESSAGE, (payload: { message: IMessage }) => {
      emit(publicChannelsActions.onMessagePosted(payload));
    });
    socket.on(
      SocketActionTypes.RESPONSE_GET_CERTIFICATES,
      (payload: SendCertificatesResponse) => {
        emit(usersActions.responseSendCertificates(payload));
      },
    );
    return () => {};
  });
}
