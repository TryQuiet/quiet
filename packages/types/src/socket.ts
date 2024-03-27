/**
 * Backend API event types. Currently, these are divided into two
 * groups: pure events and actions. Pure events are emitted from the
 * backend to notify the frontend of something and are generally named
 * with the past tense (e.g. COMMUNITY_CREATED), while actions are
 * emitted from the frontend in order to invoke the backend to do
 * something on it's behalf and are generally named as a command (e.g.
 * CREATE_COMMUNITY).
 */
export enum SocketActionTypes {
  // ====== Community ======

  COMMUNITY_CREATED = 'communityCreated',
  COMMUNITY_LAUNCHED = 'communityLaunched',
  COMMUNITY_METADATA_STORED = 'communityMetadataStored',
  CREATE_COMMUNITY = 'createCommunity',
  DOWNLOAD_INVITE_DATA = 'downloadInviteData',
  LAUNCH_COMMUNITY = 'launchCommunity',
  LEAVE_COMMUNITY = 'leaveCommunity',
  SET_COMMUNITY_CA_DATA = 'setCommunityCaData',
  SET_COMMUNITY_METADATA = 'setCommunityMetadata',

  // ====== Channels ======

  CHANNEL_SUBSCRIBED = 'channelSubscribed',
  CHANNELS_STORED = 'channelsStored',
  CREATE_CHANNEL = 'createChannel',
  DELETE_CHANNEL = 'deleteChannel',
  DELETE_FILES_FROM_CHANNEL = 'deleteFilesFromChannel',

  // ====== Messages ======

  GET_MESSAGES = 'getMessages',
  MESSAGE_IDS_STORED = 'messageIdsStored',
  MESSAGE_MEDIA_UPDATED = 'messageMediaUpdated',
  MESSAGES_STORED = 'messagesStored',
  SEND_MESSAGE = 'sendMessage',

  // ====== User ======

  SET_USER_PROFILE = 'updateUserProfile',
  USER_PROFILES_STORED = 'userProfilesStored',

  // ====== Files ======

  CANCEL_DOWNLOAD = 'cancelDownload',
  CHECK_FOR_MISSING_FILES = 'checkForMissingFiles',
  DOWNLOAD_FILE = 'downloadFile',
  DOWNLOAD_PROGRESS = 'downloadProgress',
  FILE_UPLOADED = 'fileUploaded',
  REMOVE_DOWNLOAD_STATUS = 'removeDownloadStatus',
  UPLOAD_FILE = 'uploadFile',

  // ====== Certificates ======

  ADD_CSR = 'addCsr',
  CERTIFICATES_STORED = 'certificatesStored',
  CSRS_STORED = 'csrsStored',
  OWNER_CERTIFICATE_ISSUED = 'ownerCertificateIssued',
  REGISTER_USER_CERTIFICATE = 'registerUserCertificate',
  REGISTER_OWNER_CERTIFICATE = 'registerOwnerCertificate',

  // ====== Network ======

  CLOSE = 'close',
  CONNECTED_PEERS = 'connectedPeers',
  CONNECTION = 'connection',
  CONNECTION_PROCESS_INFO = 'connectionProcess',
  CREATE_NETWORK = 'createNetwork',
  LIBP2P_PSK_STORED = 'libp2pPskStored',
  NETWORK_CREATED = 'networkCreated',
  PEER_CONNECTED = 'peerConnected',
  PEER_DISCONNECTED = 'peerDisconnected',
  PEER_LIST = 'peerList',
  TOR_INITIALIZED = 'torInitialized',

  // ====== Storage server ======

  SET_STORAGE_SERVER_ADDRESS = 'setStorageServerAddress',
  DOWNLOAD_STORAGE_SERVER_DATA = 'downloadStorageServerData',
  UPLOAD_STORAGE_SERVER_DATA = 'uploadStorageServerData',

  // ====== Misc ======

  PUSH_NOTIFICATION = 'pushNotification',
  ERROR = 'error',
}
