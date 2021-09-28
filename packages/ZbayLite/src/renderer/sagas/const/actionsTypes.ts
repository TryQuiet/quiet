
import { ActionCreator, AnyAction } from 'redux'

interface ActionsBasicType {
  [k: string]: ActionCreator<AnyAction>
}

export type ActionsType<actions extends ActionsBasicType> = {
  [k in keyof actions]: ReturnType<actions[k]>
}

export type Keys<Actions> = keyof Actions
export type ActionFromMapping<Actions> = Actions[Keys<Actions>]

export enum Socket {
  CONNECT_TO_WEBSOCKET_SERVER = 'connectToWebsocketServer',
  DISCONNECTED = 'disconnect',
  MESSAGE = 'message',
  ERROR = 'error',
  SEND_MESSAGE = 'sendMessage',
  SAVE_CERTIFICATE = 'saveCertificate',
  RESPONSE_GET_CERTIFICATE = 'sendUserCertificate',
  REGISTER_USER_CERTIFICATE = 'registerUserCertificate',
  CERTIFICATE_REGISTRATION_ERROR = 'certificateRegistrationError',
  FETCH_ALL_MESSAGES = 'fetchAllMessages',
  SUBSCRIBE_FOR_TOPIC = 'subscribeForTopic',
  RESPONSE_FETCH_ALL_MESSAGES = 'responseFetchAllMessages',
  NEW_MESSAGE = 'newMessage',
  GET_PUBLIC_CHANNELS = 'getPublicChannels',
  RESPONSE_GET_PUBLIC_CHANNELS = 'responseGetPublicChannels',
  INITIALIZE_CONVERSATION = 'initializeConversation',
  SEND_DIRECT_MESSAGE = 'sendDirectMessage',
  GET_PRIVATE_CONVERSATIONS = 'getPrivateConversations',
  RESPONSE_GET_PRIVATE_CONVERSATIONS = 'responseGetPrivateConversations',
  LOAD_ALL_DIRECT_MESSAGES = 'loadAllDirectMessages',
  DIRECT_MESSAGE = 'directMessage',
  RESPONSE_FETCH_ALL_DIRECT_MESSAGES = 'responseFetchAllDirectMessages',
  SUBSCRIBE_FOR_DIRECT_MESSAGE_THREAD = 'subscribeForDirectMessageThread',
  SUBSCRIBE_FOR_ALL_CONVERSATIONS = 'subscribeForAllConversations',
  RESPONSE_DIRECT_MESSAGE = 'responseDirectMessage',
  RESPONSE_GET_CERTIFICATES = 'responseGetCertificates',
  ASK_FOR_MESSAGES = 'askForMessages',
  SEND_IDS = 'sendIds'
}
