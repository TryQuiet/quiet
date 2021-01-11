
import { ActionCreator, AnyAction } from 'redux'

interface ActionsBasicType {
  [k: string]: ActionCreator<AnyAction>
}

export type ActionsType<actions extends ActionsBasicType> = {
  [k in keyof actions]: ReturnType<actions[k]>
}

export enum ChatMessages {
  SEND_MESSAGE = 'SEND_MESSAGE',
  FETCH_ALL_MESSAGES_MESSAGES = 'FETCH_ALL_MESSAGES_MESSAGES',
  CONNECT_TO_WEBSOCKET_SERVER = 'CONNECT_TO_WEBSOCKET_SERVER'
}
