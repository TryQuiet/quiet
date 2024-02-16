export enum SocketActionTypes {
  // ====== Community ======

  COMMUNITY_CREATED = 'communityCreated',
  COMMUNITY_LAUNCHED = 'communityLaunched',
  COMMUNITY_METADATA_STORED = 'communityMetadataStored',
  CREATE_COMMUNITY = 'createCommunity',
  LAUNCH_COMMUNITY = 'launchCommunity',
  LEAVE_COMMUNITY = 'leaveCommunity',
  SET_COMMUNITY_CA_DATA = 'setCommunityCaData',
  UPDATE_COMMUNITY_METADATA = 'updateCommunityMetadata',

  // ====== Channels ======

  CHANNEL_SUBSCRIBED = 'channelSubscribed',
  CHANNELS_STORED = 'channelsStored',
  CREATE_CHANNEL = 'createChannel',
  DELETE_CHANNEL = 'deleteChannel',
  DELETE_FILES_FROM_CHANNEL = 'deleteFilesFromChannel',

  // ====== Messages ======

  GET_MESSAGES = 'getMessages',
  MESSAGE_IDS_STORED = 'messageIdsStored',
  MESSAGES_STORED = 'messagesStored',
  SEND_MESSAGE = 'sendMessage',
  UPDATE_MESSAGE_MEDIA = 'updateMessageMedia',

  // ====== User ======

  UPDATE_USER_PROFILE = 'updateUserProfile',
  USER_PROFILES_STORED = 'userProfilesStored',

  // ====== Files ======

  CANCEL_DOWNLOAD = 'cancelDownload',
  CHECK_FOR_MISSING_FILES = 'checkForMissingFiles',
  DOWNLOAD_FILE = 'downloadFile',
  DOWNLOAD_PROGRESS = 'downloadProgress',
  FILE_UPLOADED = 'fileUploaded',
  UPLOAD_FILE = 'uploadFile',
  REMOVE_DOWNLOAD_STATUS = 'removeDownloadStatus',

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

  // ====== Misc ======

  PUSH_NOTIFICATION = 'pushNotification',
  ERROR = 'error',
}
