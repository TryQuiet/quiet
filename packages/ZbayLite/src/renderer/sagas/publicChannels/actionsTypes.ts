
import { ActionCreator, AnyAction } from 'redux'

interface ActionsBasicType {
  [k: string]: ActionCreator<AnyAction>
}

export type ActionsType<actions extends ActionsBasicType> = {
  [k in keyof actions]: ReturnType<actions[k]>
}

export enum ChatMessages {
  SEND_MESSAGE = 'SEND_MESSAGE',
  RESPONSE_FETCH_ALL_MESSAGES = 'RESPONSE_FETCH_ALL_MESSAGES',
  CONNECT_TO_WEBSOCKET_SERVER = 'CONNECT_TO_WEBSOCKET_SERVER'
}
