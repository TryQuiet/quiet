
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
  FETCH_ALL_MESSAGES = 'fetchAllMessages',
  SUBSCRIBE_FOR_TOPIC = 'subscribeForTopic',
  ADD_TOR_SERVICE = 'addTorService',
  REMOVE_TOR_SERVICE = 'removeTorService',
  RESPONSE_FETCH_ALL_MESSAGES = 'responseFetchAllMessages',
  RESPONSE_ADD_TOR_SERVICE = 'responseAddTorService',
  RESPONSE_REMOVE_TOR_SERVICE = 'removeAddTorService',
  NEW_MESSAGE = 'newMessage',
  GET_PUBLIC_CHANNELS = 'getPublicChannels',
  RESPONSE_GET_PUBLIC_CHANNELS = 'responseGetPublicChannels'
}
