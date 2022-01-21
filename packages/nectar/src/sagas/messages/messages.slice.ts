import { createSlice, EntityState, PayloadAction } from '@reduxjs/toolkit'
import { StoreKeys } from '../store.keys'
import { MessageVerificationStatus, PublicKeyMappingPayload } from './messages.types'
import { messageVerificationStatusAdapter } from './verifyMessage/verifyMessageAdapter'

export class MessagesState {
  public publicKeyMapping: Map<string, CryptoKey> = new Map()
  public messageVerificationStatus: EntityState<MessageVerificationStatus> =
    messageVerificationStatusAdapter.getInitialState()
}

export const messagesSlice = createSlice({
  initialState: { ...new MessagesState() },
  name: StoreKeys.Messages,
  reducers: {
    sendMessage: (state, _action: PayloadAction<string>) => state,
    addPublicKeyMapping: (state, action: PayloadAction<PublicKeyMappingPayload>) => {
      state.publicKeyMapping.set(action.payload.publicKey, action.payload.cryptoKey)
    },
    addMessageVerificationStatus: (state, action: PayloadAction<MessageVerificationStatus>) => {
      const status = action.payload
      messageVerificationStatusAdapter.upsertOne(
        state.messageVerificationStatus,
        status
      )
    }
  }
})

export const messagesActions = messagesSlice.actions
export const messagesReducer = messagesSlice.reducer
