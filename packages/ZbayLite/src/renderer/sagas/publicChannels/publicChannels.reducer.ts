
import { createAction } from '@reduxjs/toolkit'

import { ActionsType, ChatMessages } from './actionsTypes'

export type PublicChannelsActions = ActionsType<typeof publicChannelsActions>
export interface Libp2pMessage {
  id: string | null
  message: string | null
}

export const publicChannelsActions = {
  sendMessage: createAction(ChatMessages.SEND_MESSAGE),
  loadAllMessages: createAction<Map<string, Libp2pMessage>>(ChatMessages.RESPONSE_FETCH_ALL_MESSAGES)
}
