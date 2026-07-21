import {
  SetUserProfilePayload,
  SetUserProfileResponse,
  UserProfilesStoredEvent,
  UserProfilesUpdatedPayload,
  UsersRemovedEvent,
  UsersUpdatedEvent,
  CachedUserProfileRequest,
  CachedUserProfileResponse,
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
  AddMembersChannelPayload,
  AddMembersChannelResponse,
  type SetChannelPermissionsPayload,
} from './channel'
import {
  DownloadStatus,
  FileMetadata,
  RemoveDownloadStatus,
  type CancelDownloadPayload,
  type DeleteFilesFromChannelSocketPayload,
  type DownloadFilePayload,
  type AttachFilePayload,
} from './files'
import { type GetMessagesPayload, ChannelMessageIdsResponse, PushNotificationPayload } from './message'
import {
  type InitCommunityPayload,
  type LeaveCommunityPayload,
  type ResponseLaunchCommunityPayload,
  type ResponseCreateCommunityPayload,
  type ResponseJoinCommunityPayload,
  type ResponseLeaveCommunityPayload,
  DebugAddServerPayload,
  LaunchCommunityPayload,
  RequestInvitePayload,
  ResponseInvitePayload,
  ServerAddedPayload,
  InviteResultWithSalt,
  UpdateCommunityPayload,
} from './community'
import { ErrorPayload } from './errors'
import { HCaptchaChallengeRequest, HCaptchaFormResponse, HCaptchaRequest } from './captcha'
import { DeviceCredentialsUpdatedEvent, KeysUpdatedEvent, NseQssUrlUpdatedEvent, NseSyncSeqUpdatedEvent } from './keys'

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
  UPDATE_COMMUNITY = 'updateCommunity',
  DEBUG_ADD_SERVER = 'debugAddServer',

  // ====== Channels ======

  CREATE_CHANNEL = 'createChannel',
  DELETE_CHANNEL = 'deleteChannel',
  DELETE_FILES_FROM_CHANNEL = 'deleteFilesFromChannel',
  ADD_MEMBERS_TO_CHANNEL = 'addMembersToChannel',

  // ====== Messages ======

  GET_MESSAGES = 'getMessages',
  SEND_MESSAGE = 'sendMessage',

  // ====== User ======

  SET_USER_PROFILE = 'updateUserProfile',
  USER_PROFILES_UPDATED = 'userProfilesUpdated',

  // ====== Files ======

  CANCEL_DOWNLOAD = 'cancelDownload',
  DOWNLOAD_FILE = 'downloadFile',
  ATTACH_FILE = 'attachFile',

  // ====== Local First Auth ======

  VALIDATE_OR_CREATE_LONG_LIVED_LFA_INVITE = 'validateOrCreateLongLivedLfaInvite',

  // ====== Captcha ======
  HCAPTCHA_FORM_RESPONSE = 'hcaptchaFormResponse',
  HCAPTCHA_REQUEST = 'hcaptchaRequest',

  // ====== Push Notifications ======
  SEND_DEVICE_TOKEN = 'sendDeviceToken',

  // ====== Misc ======
  /**
   * For moving data from the frontend to the backend. Load migration
   * data into the backend.
   */
  LOAD_MIGRATION_DATA = 'loadMigrationData',
  TOGGLE_P2P = 'toggleP2P',
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

  // ====== Community ======
  COMMUNITY_LAUNCHED = 'communityLaunched',
  SERVER_ADDED = 'serverAdded',
  COMMUNITY_UPDATED = 'communityUpdated',

  // ====== Channels ======
  CHANNEL_SUBSCRIBED = 'channelSubscribed',
  CHANNELS_STORED = 'channelsStored',
  CHANNEL_PERMISSIONS_UPDATED = 'channelPermissionsUpdated',

  // ====== Messages ======
  MESSAGE_IDS_STORED = 'messageIdsStored',
  MESSAGE_MEDIA_UPDATED = 'messageMediaUpdated',
  MESSAGES_STORED = 'messagesStored',

  // ====== Users ======
  USERS_UPDATED = 'usersUpdated',
  USERS_REMOVED = 'usersRemoved',
  USER_PROFILES_STORED = 'userProfilesStored',
  CACHED_USER_PROFILE_REQUEST = 'cachedUserProfileRequest',
  KEYS_UPDATED = 'keysUpdated',
  DEVICE_CREDENTIALS_UPDATED = 'deviceCredentialsUpdated',
  USER_PROFILES_UPDATED = 'userProfilesUpdatedFwd',

  // ====== Files ======
  FILE_ATTACHED = 'fileUploaded',
  DOWNLOAD_PROGRESS = 'downloadProgress',
  REMOVE_DOWNLOAD_STATUS = 'removeDownloadStatus',

  // ====== Invites ======
  CREATED_LONG_LIVED_LFA_INVITE = 'createdLongLivedLfaInvite',

  // ====== Network ======
  PEER_CONNECTED = 'peerConnected',
  PEER_DISCONNECTED = 'peerDisconnected',
  TOR_INITIALIZED = 'torInitialized',
  QSS_CONNECTED = 'qssConnected',
  QSS_DISCONNECTED = 'qssDisconnected',
  NSE_QSS_URL_UPDATED = 'nseQssUrlUpdated',
  NSE_SYNC_SEQ_UPDATED = 'nseSyncSeqUpdated',
  MIGRATION_DATA_REQUIRED = 'migrationDataRequired',
  PUSH_NOTIFICATION = 'pushNotification',
  CONNECTION_PROCESS_INFO = 'connectionProcess',

  // ====== Captcha ======
  HCAPTCHA_CHALLENGE_REQUEST = 'hcaptchaChallengeRequest',
  HCAPTCHA_SITE_KEY = 'hcaptchaSiteKey',
  HCAPTCHA_VERIFICATION_UPDATE = 'hcaptchaVerificationUpdate',
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
  [SocketActions.UPDATE_COMMUNITY]: EmitEvent<UpdateCommunityPayload>
  [SocketActions.DEBUG_ADD_SERVER]: EmitEvent<DebugAddServerPayload>

  // ====== Channels ======
  [SocketActions.CREATE_CHANNEL]: EmitEvent<CreateChannelPayload, (response?: CreateChannelResponse) => void>
  [SocketActions.DELETE_CHANNEL]: EmitEvent<DeleteChannelPayload, (response?: DeleteChannelResponse) => void>
  [SocketActions.DELETE_FILES_FROM_CHANNEL]: EmitEvent<DeleteFilesFromChannelSocketPayload>
  [SocketActions.ADD_MEMBERS_TO_CHANNEL]: EmitEvent<
    AddMembersChannelPayload,
    (response?: AddMembersChannelResponse) => void
  >

  // ====== Messages ======
  [SocketActions.DOWNLOAD_FILE]: EmitEvent<DownloadFilePayload>
  [SocketActions.SEND_MESSAGE]: EmitEvent<ChannelMessage>
  [SocketActions.CANCEL_DOWNLOAD]: EmitEvent<CancelDownloadPayload>
  [SocketActions.ATTACH_FILE]: EmitEvent<AttachFilePayload>
  [SocketActions.GET_MESSAGES]: EmitEvent<GetMessagesPayload, (response?: MessagesLoadedPayload) => void>

  // ====== User Profiles ======
  [SocketActions.SET_USER_PROFILE]: EmitEvent<SetUserProfilePayload, (response?: SetUserProfileResponse) => void>
  [SocketActions.LOAD_MIGRATION_DATA]: EmitEvent<Record<string, any>>
  [SocketActions.USER_PROFILES_UPDATED]: EmitEvent<UserProfilesUpdatedPayload>

  // ====== Local First Auth ======
  [SocketActions.VALIDATE_OR_CREATE_LONG_LIVED_LFA_INVITE]: EmitEvent<
    RequestInvitePayload,
    (response?: ResponseInvitePayload) => void
  >

  // ====== Captcha ======
  [SocketActions.HCAPTCHA_FORM_RESPONSE]: EmitEvent<HCaptchaFormResponse>
  [SocketActions.HCAPTCHA_REQUEST]: EmitEvent<HCaptchaRequest>

  // ====== Push Notifications ======
  [SocketActions.SEND_DEVICE_TOKEN]: EmitEvent<{
    deviceToken: string
    bundleId: string
    platform: 'ios' | 'android'
  }>

  // ====== Misc ======
  [SocketActions.TOGGLE_P2P]: EmitEvent<boolean, (response: boolean) => void>
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

  // ====== Community ======
  [SocketEvents.COMMUNITY_LAUNCHED]: EmitEvent<LaunchCommunityPayload>
  [SocketEvents.SERVER_ADDED]: EmitEvent<ServerAddedPayload>
  [SocketEvents.COMMUNITY_UPDATED]: EmitEvent<UpdateCommunityPayload>

  // ====== Channels ======
  [SocketEvents.CHANNEL_SUBSCRIBED]: EmitEvent<ChannelSubscribedPayload>
  [SocketEvents.CHANNELS_STORED]: EmitEvent<ChannelsReplicatedPayload>
  [SocketEvents.CHANNEL_PERMISSIONS_UPDATED]: EmitEvent<SetChannelPermissionsPayload>

  // ====== Messages ======
  [SocketEvents.MESSAGE_IDS_STORED]: EmitEvent<ChannelMessageIdsResponse>
  [SocketEvents.MESSAGE_MEDIA_UPDATED]: EmitEvent<FileMetadata>
  [SocketEvents.MESSAGES_STORED]: EmitEvent<MessagesLoadedPayload>

  // ====== Users ======
  [SocketEvents.USERS_UPDATED]: EmitEvent<UsersUpdatedEvent>
  [SocketEvents.USERS_REMOVED]: EmitEvent<UsersRemovedEvent>
  [SocketEvents.USER_PROFILES_STORED]: EmitEvent<UserProfilesStoredEvent>
  [SocketEvents.CACHED_USER_PROFILE_REQUEST]: EmitEvent<
    CachedUserProfileRequest,
    (response?: CachedUserProfileResponse) => void
  >
  [SocketEvents.KEYS_UPDATED]: EmitEvent<KeysUpdatedEvent>
  [SocketEvents.DEVICE_CREDENTIALS_UPDATED]: EmitEvent<DeviceCredentialsUpdatedEvent>
  [SocketEvents.USER_PROFILES_UPDATED]: EmitEvent<UserProfilesUpdatedPayload>

  // ====== Files ======
  [SocketEvents.FILE_ATTACHED]: EmitEvent<FileMetadata>
  [SocketEvents.DOWNLOAD_PROGRESS]: EmitEvent<DownloadStatus>
  [SocketEvents.REMOVE_DOWNLOAD_STATUS]: EmitEvent<RemoveDownloadStatus>

  // ====== Invites ======
  [SocketEvents.CREATED_LONG_LIVED_LFA_INVITE]: EmitEvent<InviteResultWithSalt>

  // ====== Network ======
  [SocketEvents.PEER_CONNECTED]: EmitEvent<any>
  [SocketEvents.PEER_DISCONNECTED]: EmitEvent<any>
  [SocketEvents.TOR_INITIALIZED]: EmitEvent<void>
  [SocketEvents.QSS_CONNECTED]: EmitEvent<void>
  [SocketEvents.QSS_DISCONNECTED]: EmitEvent<void>
  [SocketEvents.NSE_QSS_URL_UPDATED]: EmitEvent<NseQssUrlUpdatedEvent>
  [SocketEvents.NSE_SYNC_SEQ_UPDATED]: EmitEvent<NseSyncSeqUpdatedEvent>
  [SocketEvents.MIGRATION_DATA_REQUIRED]: EmitEvent<string[]>
  [SocketEvents.PUSH_NOTIFICATION]: EmitEvent<PushNotificationPayload>
  [SocketEvents.CONNECTION_PROCESS_INFO]: EmitEvent<string>

  // ====== Captcha ======
  [SocketEvents.HCAPTCHA_CHALLENGE_REQUEST]: EmitEvent<HCaptchaChallengeRequest>
  [SocketEvents.HCAPTCHA_SITE_KEY]: EmitEvent<string>
  [SocketEvents.HCAPTCHA_VERIFICATION_UPDATE]: EmitEvent<boolean>
}
