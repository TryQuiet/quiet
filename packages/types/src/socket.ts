export enum SocketActionTypes {
  // A
  ASK_FOR_MESSAGES = 'askForMessages',
  // C
  CANCEL_DOWNLOAD = 'cancelDownload',
  CHANNELS_REPLICATED = 'channelsReplicated',
  CHANNEL_SUBSCRIBED = 'channelSubscribed',
  CLOSE = 'close',
  COMMUNITY = 'community',
  COMMUNITY_METADATA_LOADED = 'communityMetadataLoaded',
  CONNECTED_PEERS = 'connectedPeers',
  CONNECT_TO_WEBSOCKET_SERVER = 'connectToWebsocketServer',
  CONNECTION = 'connection',
  CREATE_CHANNEL = 'createChannel',
  CREATE_COMMUNITY = 'createCommunity',
  CREATE_NETWORK = 'createNetwork',
  // D
  DIRECT_MESSAGE = 'directMessage',
  DOWNLOAD_FILE = 'downloadFile',
  DOWNLOAD_PROGRESS = 'downloadProgress',
  DELETE_CHANNEL = 'deleteChannel',
  DELETE_FILES_FROM_CHANNEL = 'deleteFilesFromChannel',
  // E
  ERROR = 'error',
  // L
  LAUNCH_COMMUNITY = 'launchCommunity',
  LEAVE_COMMUNITY = 'leaveCommunity',
  LIBP2P_PSK_SAVED = 'libp2pPskSaved',
  LOADED_USER_PROFILES = 'loadedUserProfiles',
  // M
  MESSAGES_LOADED = 'messagesLoaded',
  // N
  NETWORK = 'network',
  NEW_COMMUNITY = 'newCommunity',
  // P
  PEER_CONNECTED = 'peerConnected',
  PEER_DISCONNECTED = 'peerDisconnected',
  PEER_LIST = 'peerList',
  PUSH_NOTIFICATION = 'pushNotification',
  // R
  REGISTER_USER_CERTIFICATE = 'registerUserCertificate',
  REGISTER_OWNER_CERTIFICATE = 'registerOwnerCertificate',
  REMOVE_DOWNLOAD_STATUS = 'removeDownloadStatus',
  RESPONSE_GET_CERTIFICATES = 'responseGetCertificates',
  RESPONSE_GET_CSRS = 'responseGetCsrs',
  REQUEST_PEER_ID = 'requestPeerId',
  // S
  SAVED_OWNER_CERTIFICATE = 'savedOwnerCertificate',
  SAVE_USER_CSR = 'saveUserCsr',
  SAVE_USER_PROFILE = 'saveUserProfile',
  SAVED_USER_CSR = 'savedUserCsr',
  SEND_MESSAGE = 'sendMessage',
  SEND_MESSAGES_IDS = 'sendIds',
  SEND_PEER_ID = 'sendPeerId',
  SEND_COMMUNITY_METADATA = 'sendCommunityMetadata',
  SEND_COMMUNITY_CA_DATA = 'sendCommunityCaData',
  //  T
  TOR_INITIALIZED = 'torInitialized',
  CONNECTION_PROCESS_INFO = 'connectionProcess',
  // U
  UPDATE_MESSAGE_MEDIA = 'updateMessageMedia',
  UPLOAD_FILE = 'uploadFile',
  UPLOADED_FILE = 'uploadedFile',
  CHECK_FOR_MISSING_FILES = 'checkForMissingFiles',
}
