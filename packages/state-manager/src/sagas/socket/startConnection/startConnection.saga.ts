import { eventChannel } from 'redux-saga'
import { type Socket } from '../../../types'
import { all, call, fork, put, takeEvery, cancelled, take } from 'typed-redux-saga'
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
  SocketEvents,
  AttachFilePayload,
  LaunchCommunityPayload,
  HCaptchaRequest,
  HCaptchaChallengeRequest,
  InviteResultWithSalt,
  UserProfilesUpdatedPayload,
} from '@quiet/types'

import { createLogger } from '../../../utils/logger'
import { InviteResult } from '@localfirst/auth'
import { captchaActions } from '../../captcha/captcha.slice'
import { captchaMasterSaga } from '../../captcha/captchaMasterSaga'
import { pushNotificationsMasterSaga } from '../../pushNotifications/pushNotifications.master.saga'

const logger = createLogger('startConnectionSaga')

export function subscribe(socket: Socket) {
  return eventChannel<
    | ReturnType<typeof messagesActions.addMessages>
    | ReturnType<typeof messagesActions.removePendingMessageStatuses>
    | ReturnType<typeof messagesActions.checkForMessages>
    | ReturnType<typeof messagesActions.addPublicChannelsMessagesBase>
    | ReturnType<typeof messagesActions.retryVerification>
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
    | ReturnType<typeof communitiesActions.setCurrentCommunity>
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
    | ReturnType<typeof connectionActions.createInvite>
    | ReturnType<typeof connectionActions.setLongLivedInvite>
    | ReturnType<typeof communitiesActions.clearInvitationCodes>
    | ReturnType<typeof connectionActions.setTorInitialized>
    | ReturnType<typeof connectionActions.setQssConnected>
    | ReturnType<typeof connectionActions.setQssDisconnected>
    | ReturnType<typeof usersActions.setUsers>
    | ReturnType<typeof usersActions.deleteUsers>
    | ReturnType<typeof usersActions.setUserProfiles>
    | ReturnType<typeof usersActions.updateUserProfiles>
    | ReturnType<typeof appActions.loadMigrationData>
    | ReturnType<typeof captchaActions.presentChallenge>
    | ReturnType<typeof captchaActions.setSiteKey>
    | ReturnType<typeof captchaActions.setCaptchaVerified>
  >(emit => {
    // UPDATE FOR APP
    socket.on(SocketEvents.COMMUNITY_LAUNCHED, (payload: LaunchCommunityPayload) => {
      logger.info(`${SocketEvents.COMMUNITY_LAUNCHED}`, payload)
      emit(communitiesActions.setCurrentCommunity(payload.id))
      emit(networkActions.addInitializedCommunity(payload.id))
    })
    socket.on(SocketEvents.TOR_INITIALIZED, () => {
      logger.info(`${SocketEvents.TOR_INITIALIZED}`)
      emit(connectionActions.setTorInitialized())
    })
    socket.on(SocketEvents.QSS_CONNECTED, () => {
      logger.info(`${SocketEvents.QSS_CONNECTED}`)
      emit(connectionActions.setQssConnected())
    })
    socket.on(SocketEvents.QSS_DISCONNECTED, () => {
      logger.info(`${SocketEvents.QSS_DISCONNECTED}`)
      emit(connectionActions.setQssDisconnected())
    })
    socket.on(SocketEvents.CONNECTION_PROCESS_INFO, (payload: string) => {
      logger.info(`${SocketEvents.CONNECTION_PROCESS_INFO}`, payload)
      emit(connectionActions.onConnectionProcessInfo(payload))
    })
    // Misc
    socket.on(SocketEvents.PEER_CONNECTED, (payload: NetworkDataPayload) => {
      logger.info(`${SocketEvents.PEER_CONNECTED}`, payload)
      emit(networkActions.addConnectedPeers([payload.peer]))
      emit(connectionActions.setNetworkData(payload))
    })
    socket.on(SocketEvents.PEER_DISCONNECTED, (payload: NetworkDataPayload) => {
      logger.info(`${SocketEvents.PEER_DISCONNECTED}`, payload)
      emit(networkActions.removeConnectedPeer([payload.peer]))
      emit(connectionActions.updateNetworkData(payload))
    })
    socket.on(SocketEvents.MIGRATION_DATA_REQUIRED, (keys: string[]) => {
      logger.info(`${SocketEvents.MIGRATION_DATA_REQUIRED}`, keys)
      emit(appActions.loadMigrationData(keys))
    })
    // Files
    socket.on(SocketEvents.MESSAGE_MEDIA_UPDATED, (payload: FileMetadata) => {
      logger.info(`${SocketEvents.MESSAGE_MEDIA_UPDATED}`, payload)
      emit(filesActions.updateMessageMedia(payload))
    })
    socket.on(SocketEvents.FILE_ATTACHED, (payload: FileMetadata) => {
      logger.info(`${SocketEvents.FILE_ATTACHED}`, payload)
      emit(filesActions.broadcastHostedFile(payload))
    })
    socket.on(SocketEvents.DOWNLOAD_PROGRESS, (payload: DownloadStatus) => {
      logger.info(`${SocketEvents.DOWNLOAD_PROGRESS}`, payload)
      emit(filesActions.updateDownloadStatus(payload))
    })
    socket.on(SocketEvents.REMOVE_DOWNLOAD_STATUS, (payload: RemoveDownloadStatus) => {
      logger.info(`${SocketEvents.REMOVE_DOWNLOAD_STATUS}`, payload)
      emit(filesActions.removeDownloadStatus(payload))
    })
    // Channels
    socket.on(SocketEvents.CHANNELS_STORED, (payload: ChannelsReplicatedPayload) => {
      logger.info(`${SocketEvents.CHANNELS_STORED}`, payload)
      emit(publicChannelsActions.channelsReplicated(payload))
    })
    socket.on(SocketEvents.CHANNEL_SUBSCRIBED, (payload: ChannelSubscribedPayload) => {
      logger.info(`${SocketEvents.CHANNEL_SUBSCRIBED}`, payload)
      emit(publicChannelsActions.setChannelSubscribed(payload))
    })
    // Messages
    socket.on(SocketEvents.MESSAGE_IDS_STORED, (payload: ChannelMessageIdsResponse) => {
      logger.info(`${SocketEvents.MESSAGE_IDS_STORED}`, payload)
      emit(messagesActions.checkForMessages(payload))
    })
    socket.on(SocketEvents.MESSAGES_STORED, (payload: MessagesLoadedPayload) => {
      logger.info(`${SocketEvents.MESSAGES_STORED}`, payload)
      emit(messagesActions.removePendingMessageStatuses(payload))
      emit(messagesActions.addMessages(payload))
    })

    // Local First Auth

    socket.on(SocketEvents.CREATED_LONG_LIVED_LFA_INVITE, (payload: InviteResultWithSalt) => {
      logger.info(`${SocketEvents.CREATED_LONG_LIVED_LFA_INVITE}`, payload)
      emit(connectionActions.setLongLivedInvite(payload))
    })

    // Errors
    socket.on(SocketEvents.ERROR, (payload: ErrorPayload) => {
      logger.error(payload, payload.trace)
      emit(errorsActions.handleError(payload))
    })

    // Users

    socket.on(SocketEvents.USERS_UPDATED, (payload: UsersUpdatedEvent) => {
      logger.info(`${SocketEvents.USERS_UPDATED}`, payload)
      emit(usersActions.setUsers(payload.users))
      emit(messagesActions.retryVerification({ currentChannel: true }))
    })

    socket.on(SocketEvents.USERS_REMOVED, (payload: UsersUpdatedEvent) => {
      logger.info(`${SocketEvents.USERS_REMOVED}`, payload)
      emit(usersActions.deleteUsers(payload.users))
    })

    socket.on(SocketEvents.USER_PROFILES_STORED, (payload: UserProfilesStoredEvent) => {
      logger.info(`${SocketEvents.USER_PROFILES_STORED}`, payload.profiles.length)
      emit(usersActions.updateUserProfiles(payload.profiles))
      emit(messagesActions.retryVerification({ currentChannel: true }))
    })

    socket.on(SocketEvents.HCAPTCHA_CHALLENGE_REQUEST, (payload: HCaptchaChallengeRequest) => {
      logger.info(`${SocketEvents.HCAPTCHA_CHALLENGE_REQUEST}`, JSON.stringify(payload))
      emit(captchaActions.presentChallenge(payload))
    })
    socket.on(SocketEvents.HCAPTCHA_SITE_KEY, (payload: string) => {
      logger.info(`${SocketEvents.HCAPTCHA_SITE_KEY}`, payload)
      emit(captchaActions.setSiteKey(payload))
    })
    socket.on(SocketEvents.HCAPTCHA_VERIFICATION_UPDATE, (payload: boolean) => {
      logger.info(`${SocketEvents.HCAPTCHA_VERIFICATION_UPDATE}`, payload)
      emit(captchaActions.setCaptchaVerified(payload))
    })

    return () => undefined
  })
}

export function* handleActions(socket: Socket): Generator {
  logger.info('handleActions starting')
  try {
    const socketChannel = yield* call(subscribe, socket)
    yield takeEvery(socketChannel, function* (action) {
      logger.info('Dispatching action', action.type)
      yield put(action)
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
      fork(captchaMasterSaga, socket),
      fork(pushNotificationsMasterSaga, socket),
    ])
  } finally {
    logger.info('useIO stopping')
    if (yield cancelled()) {
      logger.info('useIO cancelled')
    }
  }
}
