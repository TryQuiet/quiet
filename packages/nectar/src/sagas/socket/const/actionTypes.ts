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
  CLOSE = 'close',
  COMMUNITY = 'community',
  CONNECT_TO_WEBSOCKET_SERVER = 'connectToWebsocketServer',
  CONNECTION = 'connection',
  CREATED_CHANNEL = 'createdChannel',
  CREATE_COMMUNITY = 'createCommunity',
  CREATE_NETWORK = 'createNetwork',
  // D
  DIRECT_MESSAGE = 'directMessage',
  // E
  ERROR = 'error',
  // G
  GET_PRIVATE_CONVERSATIONS = 'getPrivateConversations',
  GET_PUBLIC_CHANNELS = 'getPublicChannels',
  // I
  INITIALIZE_CONVERSATION = 'initializeConversation',
  // L
  LAUNCH_COMMUNITY = 'launchCommunity',
  LAUNCH_REGISTRAR = 'launchRegistrar',
  // M
  MESSAGE = 'message',
  // N
  NETWORK = 'network',
  NEW_COMMUNITY = 'newCommunity',
  // R
  REGISTER_USER_CERTIFICATE = 'registerUserCertificate',
  REGISTER_OWNER_CERTIFICATE = 'registerOwnerCertificate',
  REGISTRAR = 'registrar',
  RESPONSE_ASK_FOR_MESSAGES = 'responseFetchAllMessages',
  RESPONSE_FETCH_ALL_DIRECT_MESSAGES = 'responseFetchAllDirectMessages',
  RESPONSE_FETCH_ALL_MESSAGES = 'responseFetchAllMessages',
  RESPONSE_GET_CERTIFICATES = 'responseGetCertificates',
  RESPONSE_GET_PRIVATE_CONVERSATIONS = 'responseGetPrivateConversations',
  RESPONSE_GET_PUBLIC_CHANNELS = 'responseGetPublicChannels',
  REQUEST_PEER_ID = 'requestPeerId',
  // S
  SAVE_OWNER_CERTIFICATE = 'saveOwnerCertificate',
  SAVED_OWNER_CERTIFICATE = 'savedOwnerCertificate',
  SEND_DIRECT_MESSAGE = 'sendDirectMessage',
  SEND_IDS = 'sendIds',
  SEND_MESSAGE = 'sendMessage',
  SEND_MESSAGES_IDS = 'sendIds',
  SEND_PEER_ID = 'sendPeerId',
  SEND_USER_CERTIFICATE = 'sendUserCertificate',
  SUBSCRIBE_FOR_ALL_CONVERSATIONS = 'subscribeToAllConversations',
  SUBSCRIBE_FOR_DIRECT_MESSAGE_THREAD = 'subscribeToDirectMessageThread',
  SUBSCRIBE_TO_TOPIC = 'subscribeToTopic',
}
