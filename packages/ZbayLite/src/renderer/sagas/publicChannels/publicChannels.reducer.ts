
import { createAction } from '@reduxjs/toolkit'

import { ActionsType, Socket } from '../const/actionsTypes'
import { DisplayableMessage } from '../../zbay/messages.types'

export type PublicChannelsActions = ActionsType<typeof publicChannelsActions>
export interface BasicMessage {
  channelAddress: string
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

export const publicChannelsActions = {
  sendMessage: createAction(Socket.SEND_MESSAGE),
  loadMessage: createAction<Libp2pMessage>(Socket.MESSAGE),
  loadAllMessages: createAction<string>(Socket.FETCH_ALL_MESSAGES),
  subscribeForTopic: createAction<string>(Socket.SUBSCRIBE_FOR_TOPIC),
  addMessage: createAction<{
    key: string
    message: { [key: string]: DisplayableMessage }
  }>('ADD_MESSAGE')
}
