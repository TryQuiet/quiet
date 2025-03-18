import { eventChannel } from 'redux-saga'
import { type Socket } from '../../../types'
import { all, call, fork, put, takeEvery, cancelled } from 'typed-redux-saga'
import { appActions } from '../../app/app.slice'
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
  type ResponseLaunchCommunityPayload,
  type ChannelMessageIdsResponse,
  type ChannelsReplicatedPayload,
  type Community,
  type DownloadStatus,
  type ErrorPayload,
  type FileMetadata,
  type MessagesLoadedPayload,
  type NetworkDataPayload,
  type RemoveDownloadStatus,
  type ChannelSubscribedPayload,
  type UserProfilesStoredEvent,
  type Identity,
  type UsersUpdatedEvent,
  SocketActionTypes,
} from '@quiet/types'

import { createLogger } from '../../../utils/logger'
import { InviteResult } from '@localfirst/auth'

const logger = createLogger('startConnectionSaga')

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
    | ReturnType<typeof errorsActions.addError>
    | ReturnType<typeof errorsActions.handleError>
    | ReturnType<typeof identityActions.updateIdentity>
    | ReturnType<typeof identityActions.addNewIdentity>
    | ReturnType<typeof communitiesActions.createCommunity>
    | ReturnType<typeof communitiesActions.launchCommunity>
    | ReturnType<typeof communitiesActions.updateCommunityData>
    | ReturnType<typeof networkActions.addInitializedCommunity>
    | ReturnType<typeof networkActions.removeConnectedPeer>
    | ReturnType<typeof connectionActions.setNetworkData>
    | ReturnType<typeof connectionActions.updateNetworkData>
    | ReturnType<typeof networkActions.addConnectedPeers>
    | ReturnType<typeof filesActions.broadcastHostedFile>
    | ReturnType<typeof filesActions.updateMessageMedia>
    | ReturnType<typeof filesActions.updateDownloadStatus>
    | ReturnType<typeof filesActions.removeDownloadStatus>
    | ReturnType<typeof filesActions.checkForMissingFiles>
    | ReturnType<typeof connectionActions.onConnectionProcessInfo>
    | ReturnType<typeof connectionActions.torBootstrapped>
    | ReturnType<typeof connectionActions.createInvite>
    | ReturnType<typeof connectionActions.setLongLivedInvite>
    | ReturnType<typeof communitiesActions.clearInvitationCodes>
    | ReturnType<typeof connectionActions.setTorInitialized>
    | ReturnType<typeof usersActions.setUsers>
    | ReturnType<typeof usersActions.deleteUsers>
    | ReturnType<typeof usersActions.setUserProfiles>
    | ReturnType<typeof usersActions.setMyUserId>
    | ReturnType<typeof appActions.loadMigrationData>
  >(emit => {
    // UPDATE FOR APP
    socket.on(SocketActionTypes.TOR_INITIALIZED, () => {
      logger.info(`${SocketActionTypes.TOR_INITIALIZED}`)
      emit(connectionActions.setTorInitialized())
    })
    socket.on(SocketActionTypes.CONNECTION_PROCESS_INFO, (payload: string) => {
      logger.info(`${SocketActionTypes.CONNECTION_PROCESS_INFO}`, payload)
      emit(connectionActions.onConnectionProcessInfo(payload))
    })
    // Misc
    socket.on(SocketActionTypes.PEER_CONNECTED, (payload: NetworkDataPayload) => {
      logger.info(`${SocketActionTypes.PEER_CONNECTED}`, payload)
      emit(networkActions.addConnectedPeers([payload.peer]))
      emit(connectionActions.setNetworkData(payload))
    })
    socket.on(SocketActionTypes.PEER_DISCONNECTED, (payload: NetworkDataPayload) => {
      logger.info(`${SocketActionTypes.PEER_DISCONNECTED}`, payload)
      emit(networkActions.removeConnectedPeer(payload.peer))
      emit(connectionActions.updateNetworkData(payload))
    })
    socket.on(SocketActionTypes.MIGRATION_DATA_REQUIRED, (keys: string[]) => {
      logger.info(`${SocketActionTypes.MIGRATION_DATA_REQUIRED}`, keys)
      emit(appActions.loadMigrationData(keys))
    })
    // Files
    socket.on(SocketActionTypes.MESSAGE_MEDIA_UPDATED, (payload: FileMetadata) => {
      logger.info(`${SocketActionTypes.MESSAGE_MEDIA_UPDATED}`, payload)
      emit(filesActions.updateMessageMedia(payload))
    })
    socket.on(SocketActionTypes.FILE_UPLOADED, (payload: FileMetadata) => {
      logger.info(`${SocketActionTypes.FILE_UPLOADED}`, payload)
      emit(filesActions.broadcastHostedFile(payload))
    })
    socket.on(SocketActionTypes.DOWNLOAD_PROGRESS, (payload: DownloadStatus) => {
      logger.info(`${SocketActionTypes.DOWNLOAD_PROGRESS}`, payload)
      emit(filesActions.updateDownloadStatus(payload))
    })
    socket.on(SocketActionTypes.REMOVE_DOWNLOAD_STATUS, (payload: RemoveDownloadStatus) => {
      logger.info(`${SocketActionTypes.REMOVE_DOWNLOAD_STATUS}`, payload)
      emit(filesActions.removeDownloadStatus(payload))
    })
    // Channels
    socket.on(SocketActionTypes.CHANNELS_STORED, (payload: ChannelsReplicatedPayload) => {
      logger.info(`${SocketActionTypes.CHANNELS_STORED}`, payload)
      emit(publicChannelsActions.channelsReplicated(payload))
    })
    socket.on(SocketActionTypes.CHANNEL_SUBSCRIBED, (payload: ChannelSubscribedPayload) => {
      logger.info(`${SocketActionTypes.CHANNEL_SUBSCRIBED}`, payload)
      emit(publicChannelsActions.setChannelSubscribed(payload))
    })
    // Messages
    socket.on(SocketActionTypes.MESSAGE_IDS_STORED, (payload: ChannelMessageIdsResponse) => {
      logger.info(`${SocketActionTypes.MESSAGE_IDS_STORED}`, payload)
      emit(messagesActions.checkForMessages(payload))
    })
    socket.on(SocketActionTypes.MESSAGES_STORED, (payload: MessagesLoadedPayload) => {
      logger.info(`${SocketActionTypes.MESSAGES_STORED}`, payload)
      emit(messagesActions.removePendingMessageStatuses(payload))
      emit(messagesActions.addMessages(payload))
    })

    // Community

    socket.on(SocketActionTypes.COMMUNITY_LAUNCHED, (payload: ResponseLaunchCommunityPayload) => {
      logger.info(`${SocketActionTypes.COMMUNITY_LAUNCHED}`, payload)
      emit(filesActions.checkForMissingFiles(payload.id))
      emit(networkActions.addInitializedCommunity(payload.id))
      emit(communitiesActions.clearInvitationCodes())
    })

    socket.on(SocketActionTypes.COMMUNITY_UPDATED, (payload: Community) => {
      logger.info(`${SocketActionTypes.COMMUNITY_UPDATED}`, payload)
      emit(communitiesActions.updateCommunityData(payload))
    })

    // Local First Auth

    socket.on(SocketActionTypes.CREATED_LONG_LIVED_LFA_INVITE, (payload: InviteResult) => {
      logger.info(`${SocketActionTypes.CREATED_LONG_LIVED_LFA_INVITE}`, payload)
      emit(connectionActions.setLongLivedInvite(payload))
    })

    // Errors
    socket.on(SocketActionTypes.ERROR, (payload: ErrorPayload) => {
      logger.error(payload, payload.trace)
      emit(errorsActions.handleError(payload))
    })

    // Identity
    socket.on(SocketActionTypes.IDENTITY_STORED, (payload: Identity) => {
      logger.info(`${SocketActionTypes.IDENTITY_STORED}`, payload)
      emit(identityActions.updateIdentity(payload))
    })

    // Users

    socket.on(SocketActionTypes.USERS_UPDATED, (payload: UsersUpdatedEvent) => {
      logger.info(`${SocketActionTypes.USERS_UPDATED}`, payload)
      emit(usersActions.setUsers(payload.users))
    })

    socket.on(SocketActionTypes.USERS_REMOVED, (payload: UsersUpdatedEvent) => {
      logger.info(`${SocketActionTypes.USERS_REMOVED}`, payload)
      emit(usersActions.deleteUsers(payload.users))
    })

    socket.on(SocketActionTypes.USER_PROFILES_STORED, (payload: UserProfilesStoredEvent) => {
      logger.info(`${SocketActionTypes.USER_PROFILES_STORED}`, payload)
      emit(usersActions.setUserProfiles(payload.profiles))
    })
    socket.on(SocketActionTypes.SET_MY_USER_ID, (payload: string) => {
      logger.info(`${SocketActionTypes.SET_MY_USER_ID}`, payload)
      emit(usersActions.setMyUserId(payload))
    })
    return () => undefined
  })
}

export function* handleActions(socket: Socket): Generator {
  logger.info('handleActions starting')
  try {
    const socketChannel = yield* call(subscribe, socket)
    yield takeEvery(socketChannel, function* (action) {
      logger.info('Received action', action)
      yield put(action)
      logger.info('Action dispatched', action)
    })
  } finally {
    logger.info('handleActions stopping')
    if (yield cancelled()) {
      logger.info('handleActions cancelled')
    }
  }
}

export function* useIO(socket: Socket): Generator {
  logger.info('useIO starting')
  try {
    yield all([
      fork(handleActions, socket),
      fork(publicChannelsMasterSaga, socket),
      fork(messagesMasterSaga, socket),
      fork(filesMasterSaga, socket),
      fork(identityMasterSaga, socket),
      fork(communitiesMasterSaga, socket),
      fork(usersMasterSaga, socket),
      fork(appMasterSaga, socket),
      fork(connectionMasterSaga, socket),
      fork(errorsMasterSaga),
    ])
  } finally {
    logger.info('useIO stopping')
    if (yield cancelled()) {
      logger.info('useIO cancelled')
    }
  }
}
