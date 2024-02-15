export enum SocketActionTypes {
  // ====== Community ======

  COMMUNITY_CREATED = 'communityCreated',
  COMMUNITY_LAUNCHED = 'communityLaunched',
  COMMUNITY_METADATA_LOADED = 'communityMetadataLoaded',
  CREATE_COMMUNITY = 'createCommunity',
  LAUNCH_COMMUNITY = 'launchCommunity',
  LEAVE_COMMUNITY = 'leaveCommunity',
  SEND_COMMUNITY_METADATA = 'sendCommunityMetadata',
  SEND_COMMUNITY_CA_DATA = 'sendCommunityCaData',

  // ====== Channels ======

  CHANNELS_LOADED = 'channelsLoaded',
  CHANNEL_SUBSCRIBED = 'channelSubscribed',
  CREATE_CHANNEL = 'createChannel',
  DELETE_CHANNEL = 'deleteChannel',
  DELETE_FILES_FROM_CHANNEL = 'deleteFilesFromChannel',

  // ====== Messages ======

  MESSAGE_IDS_LOADED = 'messageIdsLoaded',
  MESSAGES_LOADED = 'messagesLoaded',
  SEND_MESSAGE = 'sendMessage',
  UPDATE_MESSAGE_MEDIA = 'updateMessageMedia',

  // ====== User ======

  SEND_USER_PROFILE = 'sendUserProfile',
  USER_PROFILES_LOADED = 'userProfilesLoaded',

  // ====== Files ======

  CANCEL_DOWNLOAD = 'cancelDownload',
  CHECK_FOR_MISSING_FILES = 'checkForMissingFiles',
  DOWNLOAD_FILE = 'downloadFile',
  DOWNLOAD_PROGRESS = 'downloadProgress',
  FILE_UPLOADED = 'fileUploaded',
  UPLOAD_FILE = 'uploadFile',
  REMOVE_DOWNLOAD_STATUS = 'removeDownloadStatus',

  // ====== Certificates ======

  CERTIFICATES_LOADED = 'certificatesLoaded',
  CSRS_LOADED = 'csrsLoaded',
  OWNER_CERTIFICATE_ISSUED = 'ownerCertificateIssued',
  REGISTER_USER_CERTIFICATE = 'registerUserCertificate',
  REGISTER_OWNER_CERTIFICATE = 'registerOwnerCertificate',
  SEND_CSR = 'sendCsr',

  // ====== Network ======

  CLOSE = 'close',
  CONNECTED_PEERS = 'connectedPeers',
  CONNECTION = 'connection',
  CONNECTION_PROCESS_INFO = 'connectionProcess',
  CREATE_NETWORK = 'createNetwork',
  LIBP2P_PSK_LOADED = 'libp2pPskLoaded',
  NETWORK_CREATED = 'networkCreated',
  PEER_CONNECTED = 'peerConnected',
  PEER_DISCONNECTED = 'peerDisconnected',
  PEER_LIST = 'peerList',
  TOR_INITIALIZED = 'torInitialized',

  // ====== Misc ======

  PUSH_NOTIFICATION = 'pushNotification',
  ERROR = 'error',
}
