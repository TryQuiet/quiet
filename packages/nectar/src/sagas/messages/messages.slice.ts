import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { ChannelMessage } from '../publicChannels/publicChannels.types'
import { StoreKeys } from '../store.keys'

// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class MessagesState {}

export interface SendMessagePayload {
  peerId: string
  message: ChannelMessage
}

export const messagesSlice = createSlice({
  initialState: { ...new MessagesState() },
  name: StoreKeys.Messages,
  reducers: {
    sendMessage: (state, _action: PayloadAction<string>) => state
  }
})

export const messagesActions = messagesSlice.actions
export const messagesReducer = messagesSlice.reducer
