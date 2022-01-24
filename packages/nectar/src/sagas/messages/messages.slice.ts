import { createSlice, EntityState, PayloadAction } from '@reduxjs/toolkit'
import { ChannelMessage } from '../publicChannels/publicChannels.types'
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
    },
    // Utility action for testing purposes
    test_message_verification_status: (
      state,
      action: PayloadAction<{
        message: ChannelMessage
        verified: boolean
      }>
    ) => {
      const { message, verified } = action.payload
      messageVerificationStatusAdapter.upsertOne(
        state.messageVerificationStatus,
        {
          publicKey: message.pubKey,
          signature: message.signature,
          verified: verified
        }
      )
    }
  }
})

export const messagesActions = messagesSlice.actions
export const messagesReducer = messagesSlice.reducer
