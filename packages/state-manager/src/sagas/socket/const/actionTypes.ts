import { ActionCreator, AnyAction } from 'redux'

interface ActionsBasicType {
  [k: string]: ActionCreator<AnyAction>
}

export type ActionsType<Actions extends ActionsBasicType> = {
  [k in keyof Actions]: ReturnType<Actions[k]>;
}

export type Keys<Actions> = keyof Actions
export type ActionFromMapping<Actions> = Actions[Keys<Actions>]

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
  CREATED_CHANNEL = 'createdChannel',
  CREATE_COMMUNITY = 'createCommunity',
  CREATE_NETWORK = 'createNetwork',
  // D
  DIRECT_MESSAGE = 'directMessage',
  DOWNLOAD_FILE = 'downloadFile',
  DOWNLOAD_PROGRESS = 'downloadProgress',
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
  RESPONSE_GET_PRIVATE_CONVERSATIONS = 'responseGetPrivateConversations',
  REQUEST_PEER_ID = 'requestPeerId',
  // S
  SAVE_OWNER_CERTIFICATE = 'saveOwnerCertificate',
  SAVED_OWNER_CERTIFICATE = 'savedOwnerCertificate',
  SEND_DIRECT_MESSAGE = 'sendDirectMessage',
  SEND_MESSAGE = 'sendMessage',
  SEND_MESSAGES_IDS = 'sendIds',
  SEND_PEER_ID = 'sendPeerId',
  SEND_USER_CERTIFICATE = 'sendUserCertificate',
  SUBSCRIBE_FOR_ALL_CONVERSATIONS = 'subscribeToAllConversations',
  SUBSCRIBE_FOR_DIRECT_MESSAGE_THREAD = 'subscribeToDirectMessageThread',
  SUBSCRIBE_TO_TOPIC = 'subscribeToTopic',
  // U
  UPDATE_MESSAGE_MEDIA = 'updateMessageMedia',
  UPLOAD_FILE = 'uploadFile',
  UPLOADED_FILE = 'uploadedFile'
}
