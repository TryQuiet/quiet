import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { StoreKeys } from '../store.keys'

// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class MessagesState {}

export const messagesSlice = createSlice({
  initialState: { ...new MessagesState() },
  name: StoreKeys.Messages,
  reducers: {
    sendMessage: (state, _action: PayloadAction<string>) => state
  }
})

export const messagesActions = messagesSlice.actions
export const messagesReducer = messagesSlice.reducer
