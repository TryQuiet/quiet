import { Socket } from 'socket.io-client';
import { all, call, put, takeEvery, fork } from 'typed-redux-saga';
import { eventChannel } from 'redux-saga';
import { SocketActionTypes } from '../const/actionTypes';
import logger from '../../../utils/logger';
const log = logger('socket');

import {
  GetPublicChannelsResponse,
  OnMessagePostedResponse,
  publicChannelsActions,
  ChannelMessagesIdsResponse,
  AskForMessagesResponse,
} from '../../publicChannels/publicChannels.slice';
import { publicChannelsMasterSaga } from '../../publicChannels/publicChannels.master.saga';
import { ErrorPayload, errorsActions } from '../../errors/errors.slice';
import { identityActions } from '../../identity/identity.slice';
import { identityMasterSaga } from '../../identity/identity.master.saga';
import { messagesMasterSaga } from '../../messages/messages.master.saga';
import {
  SendCertificatesResponse,
  usersActions,
} from '../../users/users.slice';
import { communitiesMasterSaga } from '../../communities/communities.master.saga';
import { errorsMasterSaga } from '../../errors/errors.master.saga';
import {
  communitiesActions,
  ResponseCreateCommunityPayload,
  ResponseLaunchCommunityPayload,
  ResponseRegistrarPayload,
} from '../../communities/communities.slice';
import { appMasterSaga } from '../../app/app.master.saga';

export function subscribe(socket: Socket) {
  return eventChannel<
    | ReturnType<typeof publicChannelsActions.responseGetPublicChannels>
    | ReturnType<typeof publicChannelsActions.responseSendMessagesIds>
    | ReturnType<typeof publicChannelsActions.responseAskForMessages>
    | ReturnType<typeof publicChannelsActions.onMessagePosted>
    | ReturnType<typeof usersActions.responseSendCertificates>
    | ReturnType<typeof communitiesActions.responseCreateCommunity>
    | ReturnType<typeof errorsActions.addError>
    | ReturnType<typeof identityActions.storeUserCertificate>
    | ReturnType<typeof identityActions.throwIdentityError>
    | ReturnType<typeof communitiesActions.storePeerList>
    | ReturnType<typeof communitiesActions.updateCommunity>
  >((emit) => {
    socket.on(
      SocketActionTypes.RESPONSE_GET_PUBLIC_CHANNELS,
      (payload: GetPublicChannelsResponse) => {
        emit(publicChannelsActions.responseGetPublicChannels(payload));
        emit(publicChannelsActions.subscribeForAllTopics(payload.communityId));
      }
    );
    socket.on(
      SocketActionTypes.SEND_MESSAGES_IDS,
      (payload: ChannelMessagesIdsResponse) => {
        emit(publicChannelsActions.responseSendMessagesIds(payload));
      }
    );
    socket.on(
      SocketActionTypes.RESPONSE_ASK_FOR_MESSAGES,
      (payload: AskForMessagesResponse) => {
        emit(publicChannelsActions.responseAskForMessages(payload));
      }
    );
    socket.on(SocketActionTypes.MESSAGE, (payload: OnMessagePostedResponse) => {
      emit(publicChannelsActions.onMessagePosted(payload));
    });
    socket.on(
      SocketActionTypes.RESPONSE_GET_CERTIFICATES,
      (payload: SendCertificatesResponse) => {
        emit(usersActions.responseSendCertificates(payload));
      }
    );
    socket.on(
      SocketActionTypes.NEW_COMMUNITY,
      (payload: ResponseCreateCommunityPayload) => {
        log('createdCommunity');
        log(payload);
        emit(communitiesActions.responseCreateCommunity(payload));
      }
    );
    socket.on(
      SocketActionTypes.REGISTRAR,
      (payload: ResponseRegistrarPayload) => {
        log('created REGISTRAR');
        log(payload);
        emit(communitiesActions.responseRegistrar(payload));
        emit(identityActions.saveOwnerCertToDb());
      }
    );
    socket.on(SocketActionTypes.NETWORK, (payload: any) => {
      log('created NETWORK');
      log(payload);
      emit(communitiesActions.responseCreateCommunity(payload));
    });
    socket.on(
      SocketActionTypes.COMMUNITY,
      (payload: ResponseLaunchCommunityPayload) => {
        log('launched COMMUNITY');
        log(payload.id);
        emit(publicChannelsActions.subscribeForAllTopics(payload.id));
        emit(communitiesActions.launchRegistrar(payload.id));
        emit(communitiesActions.community(payload.id));
      }
    );
    socket.on(SocketActionTypes.ERROR, (payload: ErrorPayload) => {
      log('Got Error');
      log(payload);
      emit(errorsActions.addError(payload));
    });
    socket.on(
      SocketActionTypes.SEND_USER_CERTIFICATE,
      (payload: {
        id: string;
        payload: { peers: string[]; certificate: string; rootCa: string };
      }) => {
        log('got response with cert', payload.payload.rootCa);
        emit(
          communitiesActions.storePeerList({
            communityId: payload.id,
            peerList: payload.payload.peers,
          })
        );
        emit(
          identityActions.storeUserCertificate({
            userCertificate: payload.payload.certificate,
            communityId: payload.id,
          })
        );
        emit(
          communitiesActions.updateCommunity({
            id: payload.id,
            rootCa: payload.payload.rootCa,
          })
        );
        emit(communitiesActions.launchCommunity());
      }
    );
    socket.on(SocketActionTypes.SAVED_OWNER_CERTIFICATE, () => {
      emit(identityActions.savedOwnerCertificate());
    });
    return () => {};
  });
}

export function* handleActions(socket: Socket): Generator {
  const socketChannel = yield* call(subscribe, socket);
  yield takeEvery(socketChannel, function* (action) {
    yield put(action);
  });
}

export function* useIO(socket: Socket): Generator {
  yield all([
    fork(handleActions, socket),
    fork(publicChannelsMasterSaga, socket),
    fork(messagesMasterSaga, socket),
    fork(identityMasterSaga, socket),
    fork(communitiesMasterSaga, socket),
    fork(appMasterSaga, socket),
    fork(errorsMasterSaga),
  ]);
}
