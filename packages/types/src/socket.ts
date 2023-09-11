export enum SocketActionTypes {
  // A
  ASK_FOR_MESSAGES = 'askForMessages',
  // C
  CANCEL_DOWNLOAD = 'cancelDownload',
  CHANNELS_REPLICATED = 'channelsReplicated',
  CHANNEL_SUBSCRIBED = 'channelSubscribed',
  CLOSE = 'close',
  COMMUNITY = 'community',
  CONNECTED_PEERS = 'connectedPeers',
  CONNECT_TO_WEBSOCKET_SERVER = 'connectToWebsocketServer',
  CONNECTION = 'connection',
  CREATE_CHANNEL = 'createChannel',
  CREATED_CHANNEL = 'createdChannel',
  CREATE_COMMUNITY = 'createCommunity',
  CREATE_NETWORK = 'createNetwork',
  // D
  DIRECT_MESSAGE = 'directMessage',
  DOWNLOAD_FILE = 'downloadFile',
  DOWNLOAD_PROGRESS = 'downloadProgress',
  DELETE_CHANNEL = 'deleteChannel',
  DELETE_FILES_FROM_CHANNEL = 'deleteFilesFromChannel',
  CHANNEL_DELETION_RESPONSE = 'channelDeletionResponse',
  // E
  ERROR = 'error',
  // G
  GET_PRIVATE_CONVERSATIONS = 'getPrivateConversations',
  GET_PUBLIC_CHANNELS = 'getPublicChannels',
  // I
  INCOMING_MESSAGES = 'incomingMessages',
  INITIALIZE_CONVERSATION = 'initializeConversation',
  // L
  LAUNCH_COMMUNITY = 'launchCommunity',
  LAUNCH_REGISTRAR = 'launchRegistrar',
  LEAVE_COMMUNITY = 'leaveCommunity',
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
  REGISTRAR = 'registrar',
  REMOVE_DOWNLOAD_STATUS = 'removeDownloadStatus',
  RESPONSE_FETCH_ALL_DIRECT_MESSAGES = 'responseFetchAllDirectMessages',
  RESPONSE_GET_CERTIFICATES = 'responseGetCertificates',
  RESPONSE_GET_CSRS = 'responseGetCsrs',
  RESPONSE_GET_PRIVATE_CONVERSATIONS = 'responseGetPrivateConversations',
  REQUEST_PEER_ID = 'requestPeerId',
  // S
  SAVE_OWNER_CERTIFICATE = 'saveOwnerCertificate',
  SAVED_OWNER_CERTIFICATE = 'savedOwnerCertificate',
  SAVE_USER_CSR = 'saveUserCsr',
  SAVE_COMMUNITY_METADATA = 'saveCommunityMetadata',
  SAVED_USER_CSR = 'savedUserCsr',
  SEND_DIRECT_MESSAGE = 'sendDirectMessage',
  SEND_MESSAGE = 'sendMessage',
  SEND_MESSAGES_IDS = 'sendIds',
  SEND_PEER_ID = 'sendPeerId',
  SEND_USER_CERTIFICATE = 'sendUserCertificate',
  SEND_COMMUNITY_METADATA = 'sendCommunityMetadata',
  SUBSCRIBE_FOR_ALL_CONVERSATIONS = 'subscribeToAllConversations',
  SUBSCRIBE_FOR_DIRECT_MESSAGE_THREAD = 'subscribeToDirectMessageThread',
  //  T
  TOR_INITIALIZED = 'torInitialized',
  CONNECTION_PROCESS_INFO = 'torConnectionProcess',
  // U
  UPDATE_MESSAGE_MEDIA = 'updateMessageMedia',
  UPLOAD_FILE = 'uploadFile',
  UPLOADED_FILE = 'uploadedFile',
  CHECK_FOR_MISSING_FILES = 'checkForMissingFiles',
}
