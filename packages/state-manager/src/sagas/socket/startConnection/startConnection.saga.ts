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
import { usersMasterSaga } from '../../users/users.master.saga'
import { usersActions } from '../../users/users.slice'
import { filesActions } from '../../files/files.slice'
import { networkActions } from '../../network/network.slice'
import {
  type ResponseCreateCommunityPayload,
  type StorePeerListPayload,
  type ResponseCreateNetworkPayload,
  type ResponseLaunchCommunityPayload,
  type ChannelMessageIdsResponse,
  type ChannelsReplicatedPayload,
  type CommunityId,
  type DownloadStatus,
  type ErrorPayload,
  type FileMetadata,
  type MessagesLoadedPayload,
  type NetworkDataPayload,
  type RemoveDownloadStatus,
  type SendCertificatesResponse,
  type ChannelSubscribedPayload,
  type SavedOwnerCertificatePayload,
  type SendOwnerCertificatePayload,
  type SendCsrsResponse,
  type CommunityMetadata,
  type UserProfilesLoadedEvent,
  SocketActionTypes,
} from '@quiet/types'

const log = logger('socket')

export function subscribe(socket: Socket) {
  return eventChannel<
    | ReturnType<typeof messagesActions.addMessages>
    | ReturnType<typeof messagesActions.removePendingMessageStatuses>
    | ReturnType<typeof messagesActions.checkForMessages>
    | ReturnType<typeof messagesActions.addPublicChannelsMessagesBase>
    | ReturnType<typeof publicChannelsActions.addChannel>
    | ReturnType<typeof publicChannelsActions.setChannelSubscribed>
    | ReturnType<typeof publicChannelsActions.sendInitialChannelMessage>
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
    | ReturnType<typeof usersActions.setUserProfiles>
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
      log(`${SocketActionTypes.PEER_CONNECTED}: ${payload}`)
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
    socket.on(SocketActionTypes.FILE_UPLOADED, (payload: FileMetadata) => {
      emit(filesActions.broadcastHostedFile(payload))
    })
    socket.on(SocketActionTypes.DOWNLOAD_PROGRESS, (payload: DownloadStatus) => {
      emit(filesActions.updateDownloadStatus(payload))
    })
    socket.on(SocketActionTypes.REMOVE_DOWNLOAD_STATUS, (payload: RemoveDownloadStatus) => {
      emit(filesActions.removeDownloadStatus(payload))
    })
    // Channels
    socket.on(SocketActionTypes.CHANNELS_LOADED, (payload: ChannelsReplicatedPayload) => {
      emit(publicChannelsActions.channelsReplicated(payload))
    })
    socket.on(SocketActionTypes.CHANNEL_SUBSCRIBED, (payload: ChannelSubscribedPayload) => {
      emit(publicChannelsActions.setChannelSubscribed(payload))
    })
    // Messages
    socket.on(SocketActionTypes.MESSAGE_IDS_LOADED, (payload: ChannelMessageIdsResponse) => {
      emit(messagesActions.checkForMessages(payload))
    })
    socket.on(SocketActionTypes.MESSAGES_LOADED, (payload: MessagesLoadedPayload) => {
      emit(messagesActions.removePendingMessageStatuses(payload))
      emit(messagesActions.addMessages(payload))
    })

    // Community

    socket.on(SocketActionTypes.COMMUNITY_CREATED, async (payload: ResponseCreateCommunityPayload) => {
      log(`${SocketActionTypes.COMMUNITY_CREATED}: ${payload}`)
      // We can also set community metadata when we register the
      // owner's certificate. I think the only issue is that we
      // register the owner's certificate before initializing the
      // community and thus the storage service.
      emit(communitiesActions.sendCommunityMetadata())
      emit(publicChannelsActions.createGeneralChannel())
      // We also save the owner's CSR after registering their
      // certificate. It works, but it might make more sense to get
      // all the backend services up and running and then save the
      // CSR, register the owner's certificate and set community
      // metadata.
      emit(identityActions.saveUserCsr())
    })
    socket.on(SocketActionTypes.PEER_LIST, (payload: StorePeerListPayload) => {
      emit(communitiesActions.storePeerList(payload))
    })
    socket.on(SocketActionTypes.NETWORK_CREATED, (payload: ResponseCreateNetworkPayload) => {
      log(SocketActionTypes.NETWORK_CREATED, payload)
      emit(communitiesActions.responseCreateNetwork(payload))
    })
    socket.on(SocketActionTypes.COMMUNITY_LAUNCHED, (payload: ResponseLaunchCommunityPayload) => {
      console.log('Hunting for heisenbug: Community event received in state-manager')
      // TODO: We can send this once when creating the community and
      // store it in the backend.
      emit(communitiesActions.sendCommunityCaData())
      emit(filesActions.checkForMissingFiles(payload.id))
      emit(networkActions.addInitializedCommunity(payload.id))
      emit(communitiesActions.clearInvitationCodes())
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
    socket.on(SocketActionTypes.CSRS_LOADED, (payload: SendCsrsResponse) => {
      log(`${SocketActionTypes.CSRS_LOADED}`)
      emit(identityActions.checkLocalCsr(payload))
      emit(usersActions.storeCsrs(payload))
    })
    socket.on(SocketActionTypes.CERTIFICATES_LOADED, (payload: SendCertificatesResponse) => {
      emit(usersActions.responseSendCertificates(payload))
    })
    socket.on(SocketActionTypes.OWNER_CERTIFICATE_ISSUED, (payload: SavedOwnerCertificatePayload) => {
      log(`${SocketActionTypes.OWNER_CERTIFICATE_ISSUED}: ${payload.communityId}`)
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
    socket.on(SocketActionTypes.COMMUNITY_METADATA_LOADED, (payload: CommunityMetadata) => {
      log(`${SocketActionTypes.COMMUNITY_METADATA_LOADED}: ${payload}`)
      emit(communitiesActions.saveCommunityMetadata(payload))
    })
    socket.on(SocketActionTypes.LIBP2P_PSK_LOADED, (payload: { psk: string }) => {
      log(`${SocketActionTypes.LIBP2P_PSK_LOADED}`)
      emit(communitiesActions.savePSK(payload.psk))
    })

    // User Profile

    socket.on(SocketActionTypes.USER_PROFILES_LOADED, (payload: UserProfilesLoadedEvent) => {
      log(`${SocketActionTypes.LOADED_USER_PROFILES}`)
      emit(usersActions.setUserProfiles(payload.profiles))
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
    fork(usersMasterSaga, socket),
    fork(appMasterSaga, socket),
    fork(connectionMasterSaga),
    fork(errorsMasterSaga),
  ])
}
