import { Socket } from 'socket.io-client';
import { all, call, put, delay, take, fork, takeEvery } from 'typed-redux-saga';
import { eventChannel } from 'redux-saga';
import { SocketActionTypes } from '../const/actionTypes';
// import { nativeServicesActions } from '../../nativeServices/nativeServices.slice';
import {
  AskForMessagesResponse,
  ChannelMessagesIdsResponse,
  GetPublicChannelsResponse,
  publicChannelsActions,
} from '../../publicChannels/publicChannels.slice';
import { publicChannelsMasterSaga } from '../../publicChannels/publicChannels.master.saga';
import { identityActions } from '../../identity/identity.slice';
import { identityMasterSaga } from '../../identity/identity.master.saga';
import { messagesMasterSaga } from '../../messages/messages.master.saga';
import {
  SendCertificatesResponse,
  usersActions,
} from '../../users/users.slice';
import { IMessage } from '../../publicChannels/publicChannels.types';
import { communitiesMasterSaga } from '../../communities/communities.master.saga';
import {communitiesActions, ResponseCreateCommunityPayload, ResponseRegistrarPayload} from '../../communities/communities.slice'

export function* useIO(socket: Socket): Generator {
  yield all([
    fork(handleActions, socket),
    fork(publicChannelsMasterSaga, socket),
    fork(messagesMasterSaga, socket),
    fork(identityMasterSaga, socket),
    fork(communitiesMasterSaga, socket)
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
    // | ReturnType<typeof publicChannelsActions.responseGetPublicChannels>
    // | ReturnType<typeof publicChannelsActions.responseSendMessagesIds>
    // | ReturnType<typeof publicChannelsActions.responseAskForMessages>
    // | ReturnType<typeof publicChannelsActions.onMessagePosted>
    | ReturnType<typeof usersActions.responseSendCertificates>
    | ReturnType<typeof communitiesActions.responseCreateCommunity>
  >((emit) => {
    // socket.on(
    //   SocketActionTypes.RESPONSE_GET_PUBLIC_CHANNELS,
    //   (payload: GetPublicChannelsResponse) => {
    //     emit(publicChannelsActions.responseGetPublicChannels(payload));
    //   }
    // );
    // socket.on(
    //   SocketActionTypes.SEND_MESSAGES_IDS,
    //   (payload: ChannelMessagesIdsResponse) => {
    //     emit(publicChannelsActions.responseSendMessagesIds(payload));
    //   }
    // );
    // socket.on(
    //   SocketActionTypes.RESPONSE_ASK_FOR_MESSAGES,
    //   (payload: AskForMessagesResponse) => {
    //     emit(publicChannelsActions.responseAskForMessages(payload));
    //   }
    // );
    // socket.on(SocketActionTypes.MESSAGE, (payload: { message: IMessage }) => {
    //   emit(publicChannelsActions.onMessagePosted(payload));
    // });
    socket.on(
      SocketActionTypes.RESPONSE_GET_CERTIFICATES,
      (payload: SendCertificatesResponse) => {
        emit(usersActions.responseSendCertificates(payload));
      }
    );
    socket.on(
      SocketActionTypes.NEW_COMMUNITY,
      (payload: ResponseCreateCommunityPayload) => {
        console.log('createdCommunity')
        console.log(payload)
        emit(communitiesActions.responseCreateCommunity(payload));
      }
    );
    socket.on(
      SocketActionTypes.REGISTRAR,
      (payload: ResponseRegistrarPayload) => {
        console.log('created Registrar')
        console.log(payload)
        emit(communitiesActions.responseRegistrar(payload));
      }
    );
    socket.on(
      SocketActionTypes.REGISTRAR_ERROR,
      (payload: {id:string, network: string}) => {
        console.log('createdCommunity')
        console.log(payload)
        // emit(communitiesActions.responseCreateCommunity(payload));
      }
    );
  
    return () => {};
  });
}
