import { createAction } from '@reduxjs/toolkit'

import { ActionsType, Socket } from '../const/actionsTypes'
import { DisplayableMessage } from '../../zbay/messages.types'
export type DirectMessagesActions = ActionsType<typeof directMessagesActions>

export interface BasicMessage {
  channelId: string
  type: number
  signature: string
  r: number
  createdAt: number
  message: string
  id: string
  typeIndicator: number
}
export interface Libp2pMessage {
  channelAddress: string
  message: BasicMessage
}

export const directMessagesActions = {
  // Available users
  getAvailableUsers: createAction<string, Socket.GET_AVAILABLE_USERS>(Socket.GET_AVAILABLE_USERS),
  addUser: createAction<{ publicKey: string; halfKey: string }, Socket.ADD_USER>(Socket.ADD_USER),
  responseGetAvailableUsers: createAction<{[key: string]: { halfKey: string}}, Socket.RESPONSE_GET_AVAILABLE_USERS>(Socket.RESPONSE_GET_AVAILABLE_USERS),
  // Messages
  sendDirectMessage: createAction<string, Socket.SEND_DIRECT_MESSAGE>(Socket.SEND_DIRECT_MESSAGE),
  loadDirectMessage: createAction<any, Socket.DIRECT_MESSAGE>(Socket.DIRECT_MESSAGE),
  loadAllDirectMessages: createAction(Socket.LOAD_ALL_DIRECT_MESSAGES),
  responseLoadAllDirectMessages: createAction<{
    channelAddress: string
    messages: any[]
  }, Socket.RESPONSE_FETCH_ALL_DIRECT_MESSAGES>(Socket.RESPONSE_FETCH_ALL_DIRECT_MESSAGES),
  responseLoadDirectMessage: createAction<Libp2pMessage>(Socket.RESPONSE_DIRECT_MESSAGE),
  addDirectMessage: createAction<{
    key: string
    message: { [key: string]: DisplayableMessage }
  }, 'ADD_MESSAGE'>('ADD_MESSAGE'),
  // Private conversatinos
  initializeConversation: createAction<{address: string; encryptedPhrase: string}, Socket.INITIALIZE_CONVERSATION >(Socket.INITIALIZE_CONVERSATION),
  getPrivateConversations: createAction(Socket.GET_PRIVATE_CONVERSATIONS),
  responseGetPrivateConversations: createAction<{[key: string]: string}, Socket.RESPONSE_GET_PRIVATE_CONVERSATIONS>(Socket.RESPONSE_GET_PRIVATE_CONVERSATIONS),
  subscribeForDirectMessageThread: createAction<string, Socket.SUBSCRIBE_FOR_DIRECT_MESSAGE_THREAD>(Socket.SUBSCRIBE_FOR_DIRECT_MESSAGE_THREAD),
  subscribeForAllConversations: createAction<string[], Socket.SUBSCRIBE_FOR_ALL_CONVERSATIONS>(Socket.SUBSCRIBE_FOR_ALL_CONVERSATIONS),
  addMessage: createAction<{
    key: string
    message: { [key: string]: DisplayableMessage }
  }, 'ADD_MESSAGE'>('ADD_MESSAGE')
}
