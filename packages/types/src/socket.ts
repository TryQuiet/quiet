export enum SocketActionTypes {
  // A
  ASK_FOR_MESSAGES = 'askForMessages',
  // C
  CANCEL_DOWNLOAD = 'cancelDownload',
  CERTIFICATES_LOADED = 'certificatesLoaded',
  CHANNEL_DELETION_RESPONSE = 'channelDeletionResponse',
  CHANNELS_LOADED = 'channelsLoaded',
  CHANNEL_SUBSCRIBED = 'channelSubscribed',
  CHECK_FOR_MISSING_FILES = 'checkForMissingFiles',
  CLOSE = 'close',
  COMMUNITY_CREATED = 'communityCreated',
  COMMUNITY_LAUNCHED = 'communityLaunched',
  COMMUNITY_METADATA_LOADED = 'communityMetadataLoaded',
  CONNECTED_PEERS = 'connectedPeers',
  CONNECTION = 'connection',
  CONNECTION_PROCESS_INFO = 'connectionProcess',
  CREATE_CHANNEL = 'createChannel',
  CREATED_CHANNEL = 'createdChannel',
  CREATE_COMMUNITY = 'createCommunity',
  CREATE_NETWORK = 'createNetwork',
  CSRS_LOADED = 'csrsLoaded',
  // D
  DELETE_CHANNEL = 'deleteChannel',
  DELETE_FILES_FROM_CHANNEL = 'deleteFilesFromChannel',
  DOWNLOAD_FILE = 'downloadFile',
  DOWNLOAD_PROGRESS = 'downloadProgress',
  // E
  ERROR = 'error',
  // I
  INCOMING_MESSAGES = 'incomingMessages',
  // L
  LAUNCH_COMMUNITY = 'launchCommunity',
  LEAVE_COMMUNITY = 'leaveCommunity',
  LIBP2P_PSK_LOADED = 'libp2pPskLoaded',
  // N
  NETWORK = 'network',
  // O
  OWNER_CERTIFICATE_LOADED = 'ownerCertificateLoaded',
  // P
  PEER_CONNECTED = 'peerConnected',
  PEER_DISCONNECTED = 'peerDisconnected',
  PEER_LIST = 'peerList',
  PUSH_NOTIFICATION = 'pushNotification',
  // R
  REGISTER_USER_CERTIFICATE = 'registerUserCertificate',
  REGISTER_OWNER_CERTIFICATE = 'registerOwnerCertificate',
  REMOVE_DOWNLOAD_STATUS = 'removeDownloadStatus',
  // S
  SEND_USER_CSR = 'sendUserCsr',
  SEND_USER_PROFILE = 'sendUserProfile',
  SEND_MESSAGE = 'sendMessage',
  SEND_MESSAGES_IDS = 'sendIds',
  SEND_PEER_ID = 'sendPeerId',
  SEND_COMMUNITY_METADATA = 'sendCommunityMetadata',
  SEND_COMMUNITY_CA_DATA = 'sendCommunityCaData',
  //  T
  TOR_INITIALIZED = 'torInitialized',
  // U
  UPDATE_MESSAGE_MEDIA = 'updateMessageMedia',
  UPLOAD_FILE = 'uploadFile',
  UPLOADED_FILE = 'uploadedFile',
  USER_CSR_LOADED = 'userCsrLoaded',
  USER_PROFILES_LOADED = 'userProfilesLoaded',
}
