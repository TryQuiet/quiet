
import { createAction } from '@reduxjs/toolkit'

import { ActionsType, ChatMessages } from './actionsTypes'

export type SessionActions = ActionsType<typeof publicChannelsActions>

export const publicChannelsActions = {
  sendMessage: createAction(ChatMessages.SEND_MESSAGE)
}
