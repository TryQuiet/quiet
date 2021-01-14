
import { createAction } from '@reduxjs/toolkit'

import { ActionsType, Socket } from '../const/actionsTypes'

export type PublicChannelsActions = ActionsType<typeof socketsActions>
export interface Libp2pMessage {
  id: string | null
  message: string | null
}

export const socketsActions = {
  connect: createAction(Socket.CONNECT_TO_WEBSOCKET_SERVER)
}
