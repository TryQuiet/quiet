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
import { FileMetadata } from '../../files/files.types'
import { identityMasterSaga } from '../../identity/identity.master.saga'
import { identityActions } from '../../identity/identity.slice'
import { messagesMasterSaga } from '../../messages/messages.master.saga'
import { filesMasterSaga } from '../../files/files.master.saga'
import { messagesActions } from '../../messages/messages.slice'
import { ChannelMessagesIdsResponse } from '../../messages/messages.types'
import { publicChannelsMasterSaga } from '../../publicChannels/publicChannels.master.saga'
import {
  publicChannelsActions
} from '../../publicChannels/publicChannels.slice'
import {
  CreatedChannelResponse,
  GetPublicChannelsResponse,
  IncomingMessages,
  SetChannelSubscribedPayload
} from '../../publicChannels/publicChannels.types'

import { usersActions } from '../../users/users.slice'
import { SendCertificatesResponse } from '../../users/users.types'
import { SocketActionTypes } from '../const/actionTypes'

const log = logger('socket')

export function subscribe(socket: Socket) {
  return eventChannel<
  | ReturnType<typeof messagesActions.incomingMessages>
  | ReturnType<typeof messagesActions.addPublicChannelsMessagesBase>
  | ReturnType<typeof publicChannelsActions.addChannel>
  | ReturnType<typeof publicChannelsActions.setChannelSubscribed>
  | ReturnType<typeof publicChannelsActions.sendInitialChannelMessage>
  | ReturnType<typeof publicChannelsActions.sendNewUserInfoMessage>
  | ReturnType<typeof publicChannelsActions.responseGetPublicChannels>
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
  | ReturnType<typeof messagesActions.downloadedFile>
  | ReturnType<typeof messagesActions.uploadedFile>
  >((emit) => {
    // Misc
    socket.on(SocketActionTypes.CONNECTED_PEERS, (payload: { connectedPeers: ConnectedPeers }) => {
      emit(connectionActions.addConnectedPeers(payload.connectedPeers))
    })
    // Files
    socket.on(SocketActionTypes.DOWNLOADED_FILE, (payload: FileMetadata) => {
      emit(messagesActions.downloadedFile(payload))
    })
    socket.on(SocketActionTypes.UPLOADED_FILE, (payload: FileMetadata) => {
      emit(messagesActions.uploadedFile(payload))
    })
    // Channels
    socket.on(SocketActionTypes.RESPONSE_GET_PUBLIC_CHANNELS, (payload: GetPublicChannelsResponse) => {
      emit(publicChannelsActions.responseGetPublicChannels(payload))
      emit(publicChannelsActions.subscribeToAllTopics())
    })
    socket.on(SocketActionTypes.CHANNEL_SUBSCRIBED, (payload: SetChannelSubscribedPayload) => {
      emit(publicChannelsActions.setChannelSubscribed(payload))
    })
    socket.on(SocketActionTypes.CREATED_CHANNEL, (payload: CreatedChannelResponse) => {
      emit(messagesActions.addPublicChannelsMessagesBase({
        channelAddress: payload.channel.address
      }))
      emit(publicChannelsActions.addChannel(payload))
      emit(publicChannelsActions.sendInitialChannelMessage({
        channelName: payload.channel.name,
        channelAddress: payload.channel.address
      }))
    })
    // Messages
    socket.on(SocketActionTypes.SEND_MESSAGES_IDS, (payload: ChannelMessagesIdsResponse) => {
      emit(messagesActions.responseSendMessagesIds(payload))
    })
    socket.on(SocketActionTypes.INCOMING_MESSAGES, (payload: IncomingMessages) => {
      const { messages } = payload
      for (const message of messages) {
        emit(messagesActions.removePendingMessageStatus(message.id))
      }
      emit(messagesActions.incomingMessages(payload))
    })
    // Community
    socket.on(SocketActionTypes.NEW_COMMUNITY, (_payload: ResponseCreateCommunityPayload) => {
      emit(identityActions.saveOwnerCertToDb())
      emit(publicChannelsActions.createGeneralChannel())
    })
    socket.on(SocketActionTypes.REGISTRAR, (payload: ResponseRegistrarPayload) => {
      log(payload)
      emit(communitiesActions.responseRegistrar(payload))
      emit(connectionActions.addInitializedRegistrar(payload.id))
    })
    socket.on(SocketActionTypes.NETWORK, (payload: ResponseCreateNetworkPayload) => {
      log(payload)
      emit(communitiesActions.responseCreateNetwork(payload))
    })
    socket.on(SocketActionTypes.COMMUNITY, (payload: ResponseLaunchCommunityPayload) => {
      emit(communitiesActions.launchRegistrar(payload.id))
      emit(connectionActions.addInitializedCommunity(payload.id))
    })
    // Errors
    socket.on(SocketActionTypes.ERROR, (payload: ErrorPayload) => {
      log(payload)
      emit(errorsActions.handleError(payload))
    })
    // Certificates
    socket.on(SocketActionTypes.RESPONSE_GET_CERTIFICATES, (payload: SendCertificatesResponse) => {
      emit(publicChannelsActions.sendNewUserInfoMessage({
        certificates: payload.certificates
      }))
      emit(usersActions.responseSendCertificates(payload))
    })
    socket.on(
      SocketActionTypes.SEND_USER_CERTIFICATE,
      (payload: {
        communityId: string
        payload: { peers: string[]; certificate: string; rootCa: string }
      }) => {
        emit(
          communitiesActions.storePeerList({
            communityId: payload.communityId,
            peerList: payload.payload.peers
          })
        )
        emit(
          identityActions.storeUserCertificate({
            userCertificate: payload.payload.certificate,
            communityId: payload.communityId
          })
        )
        emit(
          communitiesActions.updateCommunity({
            id: payload.communityId,
            rootCa: payload.payload.rootCa
          })
        )
        emit(communitiesActions.launchCommunity())
      }
    )
    socket.on(
      SocketActionTypes.SAVED_OWNER_CERTIFICATE,
      (payload: {
        communityId: string
        network: { certificate: string; peers: string[] }
      }) => {
        emit(
          communitiesActions.storePeerList({
            communityId: payload.communityId,
            peerList: payload.network.peers
          })
        )
        emit(
          identityActions.storeUserCertificate({
            userCertificate: payload.network.certificate,
            communityId: payload.communityId
          })
        )
        emit(identityActions.savedOwnerCertificate(payload.communityId))
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
    fork(filesMasterSaga, socket),
    fork(identityMasterSaga, socket),
    fork(communitiesMasterSaga, socket),
    fork(appMasterSaga, socket),
    fork(errorsMasterSaga)
  ])
}
