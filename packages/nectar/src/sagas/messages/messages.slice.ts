import { createSlice, Dictionary, EntityState, PayloadAction } from '@reduxjs/toolkit'
import { ChannelMessage } from '../publicChannels/publicChannels.types'
import { StoreKeys } from '../store.keys'
import {
  messageVerificationStatusAdapter,
  messageSendingStatusAdapter
} from './messages.adapter.ts'
import {
  MessageVerificationStatus,
  MessageSendingStatus,
  PublicKeyMappingPayload,
  WriteMessagePayload
} from './messages.types'

export class MessagesState {
  public publicKeyMapping: Dictionary<CryptoKey> = {}
  public messageVerificationStatus: EntityState<MessageVerificationStatus> =
    messageVerificationStatusAdapter.getInitialState()
  public messageSendingStatus: EntityState<MessageSendingStatus> =
    messageSendingStatusAdapter.getInitialState()
}

export const messagesSlice = createSlice({
  initialState: { ...new MessagesState() },
  name: StoreKeys.Messages,
  reducers: {
    sendMessage: (state, _action: PayloadAction<WriteMessagePayload>) => state,
    addPublicKeyMapping: (state, action: PayloadAction<PublicKeyMappingPayload>) => {
      state.publicKeyMapping[action.payload.publicKey] = action.payload.cryptoKey
    },
    addMessageVerificationStatus: (state, action: PayloadAction<MessageVerificationStatus>) => {
      const status = action.payload
      messageVerificationStatusAdapter.upsertOne(state.messageVerificationStatus, status)
    },
    addMessagesSendingStatus: (state, action: PayloadAction<MessageSendingStatus>) => {
      const status = action.payload
      messageSendingStatusAdapter.upsertOne(state.messageSendingStatus, status)
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
      messageVerificationStatusAdapter.upsertOne(state.messageVerificationStatus, {
        publicKey: message.pubKey,
        signature: message.signature,
        verified: verified
      })
    }
  }
})

export const messagesActions = messagesSlice.actions
export const messagesReducer = messagesSlice.reducer
