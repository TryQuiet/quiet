import {
  SetUserProfilePayload,
  UserProfilesStoredEvent,
  UsersRemovedEvent,
  UsersUpdatedEvent,
  type UserProfile,
} from './user'
import {
  type DeleteChannelPayload,
  type CreateChannelPayload,
  type CreateChannelResponse,
  type DeleteChannelResponse,
  type MessagesLoadedPayload,
  ChannelSubscribedPayload,
  ChannelsReplicatedPayload,
  ChannelMessage,
} from './channel'
import {
  DownloadStatus,
  FileMetadata,
  RemoveDownloadStatus,
  type CancelDownloadPayload,
  type DeleteFilesFromChannelSocketPayload,
  type DownloadFilePayload,
  type UploadFilePayload,
} from './files'
import {
  type SendMessagePayload,
  type GetMessagesPayload,
  ChannelMessageIdsResponse,
  PushNotificationPayload,
} from './message'
import {
  type InitCommunityPayload,
  type LeaveCommunityPayload,
  type ResponseLaunchCommunityPayload,
  type ResponseCreateCommunityPayload,
  type ResponseJoinCommunityPayload,
  type ResponseLeaveCommunityPayload,
  LaunchCommunityPayload,
  RequestInvitePayload,
  ResponseInvitePayload,
} from './community'
import { ErrorPayload } from './errors'
import { InviteResult } from '@localfirst/auth'

// -----------------------------------------------------------------------------
// SocketActions: These are the actions the frontend emits to the backend
// -----------------------------------------------------------------------------
export enum SocketActions {
  // ====== Application ======

  /**
   * Start the backend. Currently, the frontend depends on events
   * emitted from the backend, so we wait to start the backend until
   * the frontend is connected and listening.
   */
  START = 'start',
  CLOSE = 'close',
  CONNECTION = 'connection',
  DISCONNECT = 'disconnect',
  ERROR = 'error',

  // ====== Community ======

  CREATE_COMMUNITY = 'createCommunity',
  JOIN_COMMUNITY = 'joinCommunity',
  LAUNCH_COMMUNITY = 'launchCommunity',
  LEAVE_COMMUNITY = 'leaveCommunity',

  // ====== Channels ======

  CREATE_CHANNEL = 'createChannel',
  DELETE_CHANNEL = 'deleteChannel',
  DELETE_FILES_FROM_CHANNEL = 'deleteFilesFromChannel',

  // ====== Messages ======

  GET_MESSAGES = 'getMessages',
  SEND_MESSAGE = 'sendMessage',

  // ====== User ======

  SET_USER_PROFILE = 'updateUserProfile',

  // ====== Files ======

  CANCEL_DOWNLOAD = 'cancelDownload',
  DOWNLOAD_FILE = 'downloadFile',
  UPLOAD_FILE = 'uploadFile',

  // ====== Local First Auth ======

  VALIDATE_OR_CREATE_LONG_LIVED_LFA_INVITE = 'validateOrCreateLongLivedLfaInvite',

  // ====== Misc ======
  /**
   * For moving data from the frontend to the backend. Load migration
   * data into the backend.
   */
  LOAD_MIGRATION_DATA = 'loadMigrationData',
}

// -----------------------------------------------------------------------------
// SocketEvents: These are the events the backend emits to the frontend containing data
// -----------------------------------------------------------------------------
export enum SocketEvents {
  // ====== Application ======
  CLOSE = 'close',
  CONNECTION = 'connection',
  DISCONNECT = 'disconnect',
  ERROR = 'error',

  // ====== Channels ======
  CHANNEL_SUBSCRIBED = 'channelSubscribed',
  CHANNELS_STORED = 'channelsStored',

  // ====== Messages ======
  MESSAGE_IDS_STORED = 'messageIdsStored',
  MESSAGE_MEDIA_UPDATED = 'messageMediaUpdated',
  MESSAGES_STORED = 'messagesStored',

  // ====== Users ======
  USERS_UPDATED = 'usersUpdated',
  USERS_REMOVED = 'usersRemoved',
  USER_PROFILES_STORED = 'userProfilesStored',

  // ====== Files ======
  FILE_UPLOADED = 'fileUploaded',
  DOWNLOAD_PROGRESS = 'downloadProgress',
  REMOVE_DOWNLOAD_STATUS = 'removeDownloadStatus',

  // ====== Invites ======
  CREATED_LONG_LIVED_LFA_INVITE = 'createdLongLivedLfaInvite',

  // ====== Network ======
  PEER_CONNECTED = 'peerConnected',
  PEER_DISCONNECTED = 'peerDisconnected',
  TOR_INITIALIZED = 'torInitialized',
  MIGRATION_DATA_REQUIRED = 'migrationDataRequired',
  PUSH_NOTIFICATION = 'pushNotification',
  CONNECTION_PROCESS_INFO = 'connectionProcess',
}

type EmitEvent<Payload, Callback = (response: any) => void> = (payload: Payload, callback?: Callback) => void

// -----------------------------------------------------------------------------
// SocketActions: These are the actions the frontend emits to the backend
// -----------------------------------------------------------------------------
export interface SocketActionsMap {
  // ====== Application ======
  [SocketActions.START]: () => void
  [SocketActions.CLOSE]: () => void
  [SocketActions.CONNECTION]: () => void
  [SocketActions.DISCONNECT]: () => void
  [SocketActions.ERROR]: EmitEvent<ErrorPayload>

  // ====== Communities ======
  [SocketActions.JOIN_COMMUNITY]: EmitEvent<InitCommunityPayload, (response?: ResponseJoinCommunityPayload) => void>
  [SocketActions.CREATE_COMMUNITY]: EmitEvent<InitCommunityPayload, (response?: ResponseCreateCommunityPayload) => void>
  [SocketActions.LAUNCH_COMMUNITY]: EmitEvent<
    LaunchCommunityPayload,
    (response?: ResponseLaunchCommunityPayload) => void
  >
  [SocketActions.LEAVE_COMMUNITY]: EmitEvent<LeaveCommunityPayload, (response?: ResponseLeaveCommunityPayload) => void>

  // ====== Channels ======
  [SocketActions.CREATE_CHANNEL]: EmitEvent<CreateChannelPayload, (response?: CreateChannelResponse) => void>
  [SocketActions.DELETE_CHANNEL]: EmitEvent<DeleteChannelPayload, (response?: DeleteChannelResponse) => void>
  [SocketActions.DELETE_FILES_FROM_CHANNEL]: EmitEvent<DeleteFilesFromChannelSocketPayload>

  // ====== Messages ======
  [SocketActions.DOWNLOAD_FILE]: EmitEvent<DownloadFilePayload>
  [SocketActions.SEND_MESSAGE]: EmitEvent<ChannelMessage>
  [SocketActions.CANCEL_DOWNLOAD]: EmitEvent<CancelDownloadPayload>
  [SocketActions.UPLOAD_FILE]: EmitEvent<UploadFilePayload>
  [SocketActions.GET_MESSAGES]: EmitEvent<GetMessagesPayload, (response?: MessagesLoadedPayload) => void>

  // ====== User Profiles ======
  [SocketActions.SET_USER_PROFILE]: EmitEvent<SetUserProfilePayload>
  [SocketActions.LOAD_MIGRATION_DATA]: EmitEvent<Record<string, any>>

  // ====== Local First Auth ======
  [SocketActions.VALIDATE_OR_CREATE_LONG_LIVED_LFA_INVITE]: EmitEvent<
    RequestInvitePayload,
    (response?: ResponseInvitePayload) => void
  >
}

// -----------------------------------------------------------------------------
// SocketEvents: These are the events the backend emits to the frontend
// -----------------------------------------------------------------------------
export interface SocketEventsMap {
  // ====== Application ======
  [SocketEvents.CLOSE]: EmitEvent<void>
  [SocketEvents.CONNECTION]: EmitEvent<void>
  [SocketEvents.DISCONNECT]: EmitEvent<void>
  [SocketEvents.ERROR]: EmitEvent<ErrorPayload>

  // ====== Channels ======
  [SocketEvents.CHANNEL_SUBSCRIBED]: EmitEvent<ChannelSubscribedPayload>
  [SocketEvents.CHANNELS_STORED]: EmitEvent<ChannelsReplicatedPayload>

  // ====== Messages ======
  [SocketEvents.MESSAGE_IDS_STORED]: EmitEvent<ChannelMessageIdsResponse>
  [SocketEvents.MESSAGE_MEDIA_UPDATED]: EmitEvent<FileMetadata>
  [SocketEvents.MESSAGES_STORED]: EmitEvent<MessagesLoadedPayload>

  // ====== Users ======
  [SocketEvents.USERS_UPDATED]: EmitEvent<UsersUpdatedEvent>
  [SocketEvents.USERS_REMOVED]: EmitEvent<UsersRemovedEvent>
  [SocketEvents.USER_PROFILES_STORED]: EmitEvent<UserProfilesStoredEvent>

  // ====== Files ======
  [SocketEvents.FILE_UPLOADED]: EmitEvent<UploadFilePayload>
  [SocketEvents.DOWNLOAD_PROGRESS]: EmitEvent<DownloadStatus>
  [SocketEvents.REMOVE_DOWNLOAD_STATUS]: EmitEvent<RemoveDownloadStatus>

  // ====== Invites ======
  [SocketEvents.CREATED_LONG_LIVED_LFA_INVITE]: EmitEvent<any>

  // ====== Network ======
  [SocketEvents.PEER_CONNECTED]: EmitEvent<any>
  [SocketEvents.PEER_DISCONNECTED]: EmitEvent<any>
  [SocketEvents.TOR_INITIALIZED]: EmitEvent<void>
  [SocketEvents.MIGRATION_DATA_REQUIRED]: EmitEvent<string[]>
  [SocketEvents.PUSH_NOTIFICATION]: EmitEvent<PushNotificationPayload>
  [SocketEvents.CONNECTION_PROCESS_INFO]: EmitEvent<string>
}
