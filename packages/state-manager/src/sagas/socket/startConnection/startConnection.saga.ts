import { eventChannel } from 'redux-saga'
import { type Socket } from '../../../types'
import { all, call, fork, put, takeEvery } from 'typed-redux-saga'
import logger from '../../../utils/logger'
import { appMasterSaga } from '../../app/app.master.saga'
import { connectionActions } from '../../appConnection/connection.slice'
import { communitiesMasterSaga } from '../../communities/communities.master.saga'
import { connectionMasterSaga } from '../../appConnection/connection.master.saga'
import { communitiesActions } from '../../communities/communities.slice'
import { errorsMasterSaga } from '../../errors/errors.master.saga'
import { errorsActions } from '../../errors/errors.slice'
import { identityMasterSaga } from '../../identity/identity.master.saga'
import { identityActions } from '../../identity/identity.slice'
import { messagesMasterSaga } from '../../messages/messages.master.saga'
import { filesMasterSaga } from '../../files/files.master.saga'
import { messagesActions } from '../../messages/messages.slice'
import { publicChannelsMasterSaga } from '../../publicChannels/publicChannels.master.saga'
import { publicChannelsActions } from '../../publicChannels/publicChannels.slice'
import { usersActions } from '../../users/users.slice'
import { filesActions } from '../../files/files.slice'
import { networkActions } from '../../network/network.slice'
import {
  type ResponseCreateCommunityPayload,
  type StorePeerListPayload,
  type ResponseCreateNetworkPayload,
  type ResponseLaunchCommunityPayload,
  type ChannelDeletionResponsePayload,
  type ChannelMessagesIdsResponse,
  type ChannelsReplicatedPayload,
  type CommunityId,
  type CreatedChannelResponse,
  type DownloadStatus,
  type ErrorPayload,
  type FileMetadata,
  type IncomingMessages,
  type NetworkDataPayload,
  type RemoveDownloadStatus,
  type SendCertificatesResponse,
  type SetChannelSubscribedPayload,
  type SavedOwnerCertificatePayload,
  type SendOwnerCertificatePayload,
  type SendCsrsResponse,
  type CommunityMetadata,
  SocketActionTypes,
} from '@quiet/types'

const log = logger('socket')

export function subscribe(socket: Socket) {
  return eventChannel<
    | ReturnType<typeof messagesActions.incomingMessages>
    | ReturnType<typeof messagesActions.responseSendMessagesIds>
    | ReturnType<typeof messagesActions.removePendingMessageStatus>
    | ReturnType<typeof messagesActions.addPublicChannelsMessagesBase>
    | ReturnType<typeof publicChannelsActions.addChannel>
    | ReturnType<typeof publicChannelsActions.setChannelSubscribed>
    | ReturnType<typeof publicChannelsActions.sendInitialChannelMessage>
    | ReturnType<typeof publicChannelsActions.sendNewUserInfoMessage>
    | ReturnType<typeof publicChannelsActions.channelsReplicated>
    | ReturnType<typeof publicChannelsActions.createGeneralChannel>
    | ReturnType<typeof publicChannelsActions.channelDeletionResponse>
    | ReturnType<typeof usersActions.responseSendCertificates>
    | ReturnType<typeof usersActions.storeCsrs>
    | ReturnType<typeof communitiesActions.responseCreateNetwork>
    | ReturnType<typeof errorsActions.addError>
    | ReturnType<typeof errorsActions.handleError>
    | ReturnType<typeof identityActions.storeUserCertificate>
    | ReturnType<typeof identityActions.throwIdentityError>
    | ReturnType<typeof identityActions.saveOwnerCertToDb>
    | ReturnType<typeof identityActions.savedOwnerCertificate>
    | ReturnType<typeof identityActions.checkLocalCsr>
    | ReturnType<typeof communitiesActions.storePeerList>
    | ReturnType<typeof communitiesActions.updateCommunity>
    | ReturnType<typeof communitiesActions.launchCommunity>
    | ReturnType<typeof networkActions.addInitializedCommunity>
    | ReturnType<typeof networkActions.removeConnectedPeer>
    | ReturnType<typeof connectionActions.updateNetworkData>
    | ReturnType<typeof networkActions.addConnectedPeers>
    | ReturnType<typeof filesActions.broadcastHostedFile>
    | ReturnType<typeof filesActions.updateMessageMedia>
    | ReturnType<typeof filesActions.updateDownloadStatus>
    | ReturnType<typeof filesActions.removeDownloadStatus>
    | ReturnType<typeof filesActions.checkForMissingFiles>
    | ReturnType<typeof connectionActions.setTorBootstrapProcess>
    | ReturnType<typeof connectionActions.setConnectionProcess>
    | ReturnType<typeof connectionActions.torBootstrapped>
    | ReturnType<typeof communitiesActions.clearInvitationCodes>
    | ReturnType<typeof identityActions.saveUserCsr>
    | ReturnType<typeof connectionActions.setTorInitialized>
    | ReturnType<typeof communitiesActions.saveCommunityMetadata>
    | ReturnType<typeof communitiesActions.sendCommunityMetadata>
    | ReturnType<typeof communitiesActions.savePSK>
    | ReturnType<typeof communitiesActions.sendCommunityCaData>
  >(emit => {
    // UPDATE FOR APP
    socket.on(SocketActionTypes.TOR_INITIALIZED, () => {
      emit(connectionActions.setTorInitialized())
    })
    socket.on(SocketActionTypes.CONNECTION_PROCESS_INFO, (payload: string) => {
      emit(connectionActions.setConnectionProcess(payload))
    })
    // Misc
    socket.on(SocketActionTypes.PEER_CONNECTED, (payload: { peers: string[] }) => {
      log({ payload })
      emit(networkActions.addConnectedPeers(payload.peers))
    })
    socket.on(SocketActionTypes.PEER_DISCONNECTED, (payload: NetworkDataPayload) => {
      emit(networkActions.removeConnectedPeer(payload.peer))
      emit(connectionActions.updateNetworkData(payload))
    })
    // Files
    socket.on(SocketActionTypes.UPDATE_MESSAGE_MEDIA, (payload: FileMetadata) => {
      emit(filesActions.updateMessageMedia(payload))
    })
    socket.on(SocketActionTypes.UPLOADED_FILE, (payload: FileMetadata) => {
      emit(filesActions.broadcastHostedFile(payload))
    })
    socket.on(SocketActionTypes.DOWNLOAD_PROGRESS, (payload: DownloadStatus) => {
      emit(filesActions.updateDownloadStatus(payload))
    })
    socket.on(SocketActionTypes.REMOVE_DOWNLOAD_STATUS, (payload: RemoveDownloadStatus) => {
      emit(filesActions.removeDownloadStatus(payload))
    })
    // Channels
    socket.on(SocketActionTypes.CHANNELS_REPLICATED, (payload: ChannelsReplicatedPayload) => {
      emit(publicChannelsActions.channelsReplicated(payload))
    })
    socket.on(SocketActionTypes.CHANNEL_SUBSCRIBED, (payload: SetChannelSubscribedPayload) => {
      emit(publicChannelsActions.setChannelSubscribed(payload))
    })
    socket.on(SocketActionTypes.CHANNEL_DELETION_RESPONSE, (payload: ChannelDeletionResponsePayload) => {
      emit(publicChannelsActions.channelDeletionResponse(payload))
    })
    socket.on(SocketActionTypes.CREATED_CHANNEL, (payload: CreatedChannelResponse) => {
      emit(
        messagesActions.addPublicChannelsMessagesBase({
          channelId: payload.channel.id,
        })
      )
      emit(publicChannelsActions.addChannel(payload))
      emit(
        publicChannelsActions.sendInitialChannelMessage({
          channelName: payload.channel.name,
          channelId: payload.channel.id,
        })
      )
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
    socket.on(SocketActionTypes.CHECK_FOR_MISSING_FILES, (payload: CommunityId) => {
      emit(filesActions.checkForMissingFiles(payload))
    })

    // Community
    socket.on(SocketActionTypes.NEW_COMMUNITY, (_payload: ResponseCreateCommunityPayload) => {
      console.log('on SocketActionTypes.NEW_COMMUNITY')
      emit(identityActions.saveOwnerCertToDb())
      emit(publicChannelsActions.createGeneralChannel())
      emit(identityActions.saveUserCsr())
    })
    socket.on(SocketActionTypes.PEER_LIST, (payload: StorePeerListPayload) => {
      emit(communitiesActions.storePeerList(payload))
    })
    socket.on(SocketActionTypes.NETWORK, (payload: ResponseCreateNetworkPayload) => {
      log(SocketActionTypes.NETWORK, payload)
      emit(communitiesActions.responseCreateNetwork(payload))
    })
    socket.on(SocketActionTypes.COMMUNITY, (payload: ResponseLaunchCommunityPayload) => {
      console.log('Hunting for heisenbug: Community event received in state-manager')
      // TODO: We can send this once when creating the community and
      // store it in the backend.
      emit(communitiesActions.sendCommunityCaData())
      emit(filesActions.checkForMissingFiles(payload.id))
      emit(networkActions.addInitializedCommunity(payload.id))
      emit(communitiesActions.clearInvitationCodes())
      // For backward compatibility (old community):
      emit(communitiesActions.sendCommunityMetadata())
    })
    // Errors
    socket.on(SocketActionTypes.ERROR, (payload: ErrorPayload) => {
      // FIXME: It doesn't look like log errors have the red error
      // color in the console, which makes them difficult to find.
      // Also when only printing the payload, the full trace is not
      // available.
      log.error(payload)
      console.error(payload, payload.trace)
      emit(errorsActions.handleError(payload))
    })
    // Certificates
    socket.on(SocketActionTypes.RESPONSE_GET_CSRS, (payload: SendCsrsResponse) => {
      console.log('REPONSE_GET_CSRS')
      emit(identityActions.checkLocalCsr(payload))
      emit(usersActions.storeCsrs(payload))
    })
    socket.on(SocketActionTypes.RESPONSE_GET_CERTIFICATES, (payload: SendCertificatesResponse) => {
      emit(usersActions.responseSendCertificates(payload))
    })
    socket.on(SocketActionTypes.SAVED_OWNER_CERTIFICATE, (payload: SavedOwnerCertificatePayload) => {
      log(`${SocketActionTypes.SAVED_OWNER_CERTIFICATE}: ${payload.communityId}`)
      emit(
        communitiesActions.updateCommunity({
          id: payload.communityId,
          ownerCertificate: payload.network.certificate,
        })
      )
      emit(
        identityActions.storeUserCertificate({
          userCertificate: payload.network.certificate,
          communityId: payload.communityId,
        })
      )
      emit(identityActions.savedOwnerCertificate(payload.communityId))
    })
    socket.on(SocketActionTypes.COMMUNITY_METADATA_SAVED, (payload: CommunityMetadata) => {
      log(`${SocketActionTypes.COMMUNITY_METADATA_SAVED}: ${payload}`)
      emit(communitiesActions.saveCommunityMetadata(payload))
    })
    socket.on(SocketActionTypes.LIBP2P_PSK_SAVED, (payload: { psk: string }) => {
      log(`${SocketActionTypes.LIBP2P_PSK_SAVED}`)
      emit(communitiesActions.savePSK(payload.psk))
    })
    return () => undefined
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
    fork(connectionMasterSaga),
    fork(errorsMasterSaga),
  ])
}
