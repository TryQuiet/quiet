
import { createAction } from '@reduxjs/toolkit'

import { ActionsType, Socket } from '../const/actionsTypes'

export type PublicChannelsActions = ActionsType<typeof publicChannelsActions>
export interface Libp2pMessage {
  message: string | null
  channelAddress: string | null
}

export const publicChannelsActions = {
  sendMessage: createAction(Socket.SEND_MESSAGE),
  loadAllMessages: createAction<string>(Socket.FETCH_ALL_MESSAGES),
  subscribeForTopic: createAction<string>(Socket.SUBSCRIBE_FOR_TOPIC)
}
