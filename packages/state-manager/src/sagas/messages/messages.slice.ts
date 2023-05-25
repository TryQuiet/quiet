import { createSlice, Dictionary, EntityState, PayloadAction } from '@reduxjs/toolkit'
import { channelMessagesAdapter } from '../publicChannels/publicChannels.adapter'
import { StoreKeys } from '../store.keys'
import {
  messageVerificationStatusAdapter,
  messageSendingStatusAdapter,
  publicChannelsMessagesBaseAdapter
} from './messages.adapter.ts'
import { AddPublicChannelsMessagesBasePayload, AskForMessagesPayload, ChannelMessage, ChannelMessagesIdsResponse, DeleteChannelEntryPayload, IncomingMessages, instanceOfChannelMessage, LazyLoadingPayload, MessageSendingStatus, MessageVerificationStatus, PublicChannelsMessagesBase, SendDeletionMessagePayload, SetDisplayedMessagesNumberPayload, WriteMessagePayload } from '@quiet/types'

export class MessagesState {
  public publicKeyMapping: Dictionary<CryptoKey> = {}

  public publicChannelsMessagesBase: EntityState<PublicChannelsMessagesBase> =
  publicChannelsMessagesBaseAdapter.getInitialState()

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
    sendDeletionMessage: (state, _action: PayloadAction<SendDeletionMessagePayload>) =>
    state,
    deleteChannelEntry: (state, action: PayloadAction<DeleteChannelEntryPayload>) => {
      const { channelId } = action.payload
      publicChannelsMessagesBaseAdapter.removeOne(state.publicChannelsMessagesBase, channelId)
    },
    addPublicChannelsMessagesBase: (state, action: PayloadAction<AddPublicChannelsMessagesBasePayload>) => {
      const { channelId } = action.payload
      publicChannelsMessagesBaseAdapter.addOne(state.publicChannelsMessagesBase, {
        channelId: channelId,
        messages: channelMessagesAdapter.getInitialState(),
        display: 50
      })
    },
    addMessageVerificationStatus: (state, action: PayloadAction<MessageVerificationStatus>) => {
      const status = action.payload
      messageVerificationStatusAdapter.upsertOne(state.messageVerificationStatus, status)
    },
    addMessagesSendingStatus: (state, action: PayloadAction<MessageSendingStatus>) => {
      const status = action.payload
      messageSendingStatusAdapter.upsertOne(state.messageSendingStatus, status)
    },
    removePendingMessageStatus: (state, action: PayloadAction<string>) => {
      const id = action.payload
      messageSendingStatusAdapter.removeOne(state.messageSendingStatus, id)
    },
    removeMessageVerificationStatus: (state, action: PayloadAction<string>) => {
      const id = action.payload
      messageVerificationStatusAdapter.removeOne(state.messageVerificationStatus, id)
    },
    incomingMessages: (state, action: PayloadAction<IncomingMessages>) => {
      const { messages } = action.payload
      for (const message of messages) {
        if (!instanceOfChannelMessage(message)) return
        if (!state.publicChannelsMessagesBase.entities[message.channelId]) return

        let incoming = message

        const draft = state.publicChannelsMessagesBase
          .entities[message.channelId]
          ?.messages
          .entities[message.id]

        if (message.media && draft?.media?.path) {
          incoming = {
            ...message,
            media: {
              ...message.media,
              path: message.media.path ? message.media.path : draft.media.path
            }
          }
        }

        const messagesBase = state.publicChannelsMessagesBase.entities[message.channelId]
        if (!messagesBase) return

        channelMessagesAdapter.upsertOne(
          messagesBase.messages,
          incoming
        )
      }
    },
    setDisplayedMessagesNumber: (state, action: PayloadAction<SetDisplayedMessagesNumberPayload>) => {
      const { display, channelId } = action.payload
      publicChannelsMessagesBaseAdapter.updateOne(
        state.publicChannelsMessagesBase, {
          id: channelId,
          changes: {
            display: display
          }
        }
      )
    },
    askForMessages: (state, _action: PayloadAction<AskForMessagesPayload>) =>
      state,
    responseSendMessagesIds: (
      state,
      _action: PayloadAction<ChannelMessagesIdsResponse>
    ) => state,
    lazyLoading: (state, _action: PayloadAction<LazyLoadingPayload>) => state,
    extendCurrentPublicChannelCache: (state) => state,
    resetCurrentPublicChannelCache: (state) => state,
    // Utility action for testing purposes
    test_message_verification_status: (
      state,
      action: PayloadAction<{
        message: ChannelMessage
        isVerified: boolean
      }>
    ) => {
      const { message, isVerified } = action.payload
      messageVerificationStatusAdapter.upsertOne(state.messageVerificationStatus, {
        publicKey: message.pubKey,
        signature: message.signature,
        isVerified: isVerified
      })
    }
  }
})

export const messagesActions = messagesSlice.actions
export const messagesReducer = messagesSlice.reducer
