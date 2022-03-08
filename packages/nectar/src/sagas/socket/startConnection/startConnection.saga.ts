import { eventChannel } from 'redux-saga'
import { Socket } from 'socket.io-client'
import { all, call, fork, put, takeEvery } from 'typed-redux-saga'
import logger from '../../../utils/logger'
import { appMasterSaga } from '../../app/app.master.saga'
import { ConnectedPeers, connectionActions } from '../../appConnection/connection.slice'
import { communitiesMasterSaga } from '../../communities/communities.master.saga'
import { communitiesActions } from '../../communities/communities.slice'
import {
  ResponseCreateCommunityPayload,
  ResponseCreateNetworkPayload,
  ResponseLaunchCommunityPayload,
  ResponseRegistrarPayload
} from '../../communities/communities.types'
import { errorsMasterSaga } from '../../errors/errors.master.saga'
import { errorsActions } from '../../errors/errors.slice'
import { ErrorPayload } from '../../errors/errors.types'
import { identityMasterSaga } from '../../identity/identity.master.saga'
import { identityActions } from '../../identity/identity.slice'
import { messagesMasterSaga } from '../../messages/messages.master.saga'
import { publicChannelsMasterSaga } from '../../publicChannels/publicChannels.master.saga'
import {
  publicChannelsActions
} from '../../publicChannels/publicChannels.slice'
import {
  ChannelMessagesIdsResponse,
  CreatedChannelResponse,
  GetPublicChannelsResponse,
  IncomingMessages
} from '../../publicChannels/publicChannels.types'
import { usersActions } from '../../users/users.slice'
import { SendCertificatesResponse } from '../../users/users.types'
import { SocketActionTypes } from '../const/actionTypes'

const log = logger('socket')

export function subscribe(socket: Socket) {
  return eventChannel<
  | ReturnType<typeof publicChannelsActions.addChannel>
  | ReturnType<typeof publicChannelsActions.responseGetPublicChannels>
  | ReturnType<typeof publicChannelsActions.responseSendMessagesIds>
  | ReturnType<typeof publicChannelsActions.incomingMessages>
  | ReturnType<typeof publicChannelsActions.createGeneralChannel>
  | ReturnType<typeof usersActions.responseSendCertificates>
  | ReturnType<typeof communitiesActions.responseCreateNetwork>
  | ReturnType<typeof errorsActions.addError>
  | ReturnType<typeof identityActions.storeUserCertificate>
  | ReturnType<typeof identityActions.throwIdentityError>
  | ReturnType<typeof communitiesActions.storePeerList>
  | ReturnType<typeof communitiesActions.updateCommunity>
  | ReturnType<typeof communitiesActions.responseRegistrar>
  | ReturnType<typeof connectionActions.addInitializedCommunity>
  | ReturnType<typeof connectionActions.addInitializedRegistrar>
  | ReturnType<typeof connectionActions.addConnectedPeers>
  >((emit) => {
    socket.on(SocketActionTypes.CONNECTED_PEERS, (payload: { connectedPeers: ConnectedPeers }) => {
      emit(connectionActions.addConnectedPeers(payload.connectedPeers))
    })
    socket.on(SocketActionTypes.RESPONSE_GET_PUBLIC_CHANNELS, (payload: GetPublicChannelsResponse) => {
        emit(publicChannelsActions.responseGetPublicChannels(payload))
        emit(publicChannelsActions.subscribeToAllTopics(payload.communityId))
      }
    )
    socket.on(SocketActionTypes.CREATED_CHANNEL, (payload: CreatedChannelResponse) => {
      emit(publicChannelsActions.addChannel(payload))
    })
    socket.on(SocketActionTypes.SEND_MESSAGES_IDS, (payload: ChannelMessagesIdsResponse) => {
      emit(publicChannelsActions.responseSendMessagesIds(payload))
    })
    socket.on(SocketActionTypes.INCOMING_MESSAGES, (payload: IncomingMessages) => {
      emit(publicChannelsActions.incomingMessages(payload))
    })
    socket.on(SocketActionTypes.RESPONSE_GET_CERTIFICATES, (payload: SendCertificatesResponse) => {
      emit(usersActions.responseSendCertificates(payload))
    })
    socket.on(SocketActionTypes.NEW_COMMUNITY, (payload: ResponseCreateCommunityPayload) => {
      log('created COMMUNITY')
      emit(identityActions.saveOwnerCertToDb())
      emit(publicChannelsActions.createGeneralChannel({ communityId: payload.id }))
    })
    socket.on(SocketActionTypes.REGISTRAR, (payload: ResponseRegistrarPayload) => {
      log('created REGISTRAR')
      log(payload)
      emit(communitiesActions.responseRegistrar(payload))
      emit(connectionActions.addInitializedRegistrar(payload.id))
    })
    socket.on(SocketActionTypes.NETWORK, (payload: ResponseCreateNetworkPayload) => {
      log('created NETWORK')
      log(payload)
      emit(communitiesActions.responseCreateNetwork(payload))
    })
    socket.on(SocketActionTypes.COMMUNITY, (payload: ResponseLaunchCommunityPayload) => {
      log('launched COMMUNITY', payload.id)
      emit(communitiesActions.launchRegistrar(payload.id))
      emit(connectionActions.addInitializedCommunity(payload.id))
    })
    socket.on(SocketActionTypes.ERROR, (payload: ErrorPayload) => {
      log('Got Error')
      log(payload)
      emit(errorsActions.addError(payload))
    })
    socket.on(
      SocketActionTypes.SEND_USER_CERTIFICATE,
      (payload: {
        id: string
        payload: { peers: string[]; certificate: string; rootCa: string }
      }) => {
        log('got response with cert', payload.payload.rootCa)
        emit(
          communitiesActions.storePeerList({
            communityId: payload.id,
            peerList: payload.payload.peers
          })
        )
        emit(
          identityActions.storeUserCertificate({
            userCertificate: payload.payload.certificate,
            communityId: payload.id
          })
        )
        emit(
          communitiesActions.updateCommunity({
            id: payload.id,
            rootCa: payload.payload.rootCa
          })
        )
        emit(communitiesActions.launchCommunity())
      }
    )
    socket.on(
      SocketActionTypes.SAVED_OWNER_CERTIFICATE,
      (payload: {
        id: string
        payload: { certificate: string; peers: string[] }
      }) => {
        emit(
          communitiesActions.storePeerList({
            communityId: payload.id,
            peerList: payload.payload.peers
          })
        )
        emit(
          identityActions.storeUserCertificate({
            userCertificate: payload.payload.certificate,
            communityId: payload.id
          })
        )
        emit(identityActions.savedOwnerCertificate(payload.id))
      }
    )
    return () => { }
  })
}

export function* handleActions(socket: Socket): Generator {
  const socketChannel = yield* call(subscribe, socket)
  yield takeEvery(socketChannel, function* (action) {
    yield put(action)
  })
}

export function* useIO(socket: Socket): Generator {
  yield all([
    fork(handleActions, socket),
    fork(publicChannelsMasterSaga, socket),
    fork(messagesMasterSaga, socket),
    fork(identityMasterSaga, socket),
    fork(communitiesMasterSaga, socket),
    fork(appMasterSaga, socket),
    fork(errorsMasterSaga)
  ])
}
