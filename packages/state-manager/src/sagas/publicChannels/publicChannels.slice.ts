import { createSlice, type EntityState, type PayloadAction } from '@reduxjs/toolkit'
import { StoreKeys } from '../store.keys'
import {
  publicChannelsAdapter,
  channelMessagesAdapter,
  publicChannelsStatusAdapter,
  publicChannelsSubscriptionsAdapter,
} from './publicChannels.adapter'

import {
  type CacheMessagesPayload,
  type DeleteChannelResponse,
  type ChannelMessage,
  type ChannelsReplicatedPayload,
  type ClearMessagesCachePayload,
  type CreateChannelPayload,
  type CreateChannelResponse,
  type DeleteChannelFromStorePayload,
  type DeleteChannelPayload,
  type DisableChannelPayload,
  type Identity,
  INITIAL_CURRENT_CHANNEL_ID,
  type MarkUnreadChannelPayload,
  type PublicChannelStatus,
  type PublicChannelStorage,
  type PublicChannelSubscription,
  type SendInitialChannelMessagePayload,
  type ChannelSubscribedPayload,
  type SetCurrentChannelPayload,
  type UpdateNewestMessagePayload,
  User,
  AddMembersChannelPayload,
  EMPTY_CHANNEL_ID,
} from '@quiet/types'
import { createLogger } from '../../utils/logger'
import { prevChannelId } from './publicChannels.selectors'

const logger = createLogger('publicChannelsSlice')

export class PublicChannelsState {
  public currentChannelId: string = INITIAL_CURRENT_CHANNEL_ID

  public pendingGeneralChannelRecreation = false

  public channels: EntityState<PublicChannelStorage> = publicChannelsAdapter.getInitialState()

  public channelsStatus: EntityState<PublicChannelStatus> = publicChannelsStatusAdapter.getInitialState()

  public newMessageOpen = false

  public prevChannelId: string = INITIAL_CURRENT_CHANNEL_ID

  public channelsSubscriptions: EntityState<PublicChannelSubscription> =
    publicChannelsSubscriptionsAdapter.getInitialState()
}

export const publicChannelsSlice = createSlice({
  initialState: { ...new PublicChannelsState() },
  name: StoreKeys.PublicChannels,
  reducers: {
    createChannel: (state, _action: PayloadAction<CreateChannelPayload>) => state,
    deleteChannel: (state, _action: PayloadAction<DeleteChannelPayload>) => state,
    addMembersChannel: (state, action: PayloadAction<AddMembersChannelPayload>) => state,
    completeChannelDeletion: (state, _action) => state,
    sendIntroductionMessage: state => state,
    channelDeletionResponse: (state, _action: PayloadAction<DeleteChannelResponse>) => state,
    deleteChannelFromStore: (state, action: PayloadAction<DeleteChannelFromStorePayload>) => {
      const { channelId } = action.payload

      publicChannelsSubscriptionsAdapter.removeOne(state.channelsSubscriptions, channelId)
      publicChannelsStatusAdapter.removeOne(state.channelsStatus, channelId)
      publicChannelsAdapter.removeOne(state.channels, channelId)
    },
    disableChannel: (state, action: PayloadAction<DisableChannelPayload>) => {
      const { channelId } = action.payload
      publicChannelsAdapter.updateOne(state.channels, {
        id: channelId,
        changes: {
          disabled: true,
        },
      })
    },
    clearMessagesCache: (state, action: PayloadAction<ClearMessagesCachePayload>) => {
      const { channelId } = action.payload
      const channel = state.channels.entities[channelId]
      if (!channel) return
      channelMessagesAdapter.setAll(channel.messages, [])
    },
    startGeneralRecreation: state => {
      state.pendingGeneralChannelRecreation = true
    },
    finishGeneralRecreation: state => {
      state.pendingGeneralChannelRecreation = false
    },
    createGeneralChannel: state => state,
    sendInitialChannelMessage: (state, _action: PayloadAction<SendInitialChannelMessagePayload>) => state,
    addChannel: (state, action: PayloadAction<CreateChannelResponse>) => {
      logger.info('addChannel', action.payload)
      const { channel, displayedName } = action.payload
      publicChannelsAdapter.addOne(state.channels, {
        ...channel,
        displayedName: displayedName ?? channel.name,
        messages: channelMessagesAdapter.getInitialState(),
      })
      publicChannelsStatusAdapter.addOne(state.channelsStatus, {
        id: channel.id,
        unread: false,
        newestMessage: null,
        public: channel.public,
        type: channel.type,
      })
    },
    setChannelSubscribed: (state, action: PayloadAction<ChannelSubscribedPayload>) => {
      const { channelId } = action.payload
      logger.info('setChannelSubscribed', channelId)
      publicChannelsSubscriptionsAdapter.upsertOne(state.channelsSubscriptions, {
        id: channelId,
        subscribed: true,
      })
    },
    channelsReplicated: (state, _action: PayloadAction<ChannelsReplicatedPayload>) => state,
    setCurrentChannel: (state, action: PayloadAction<SetCurrentChannelPayload>) => {
      const { channelId } = action.payload
      state.currentChannelId = channelId
    },
    cacheMessages: (state, action: PayloadAction<CacheMessagesPayload>) => {
      const { messages, channelId } = action.payload
      const channel = state.channels.entities[channelId]
      if (!channel) return
      channelMessagesAdapter.setAll(channel.messages, messages)
    },

    markUnreadChannel: (state, action: PayloadAction<MarkUnreadChannelPayload>) => {
      const { channelId } = action.payload
      publicChannelsStatusAdapter.updateOne(state.channelsStatus, {
        id: channelId,
        changes: {
          unread: true,
        },
      })
    },
    clearUnreadChannel: (state, action: PayloadAction<MarkUnreadChannelPayload>) => {
      const { channelId } = action.payload
      publicChannelsStatusAdapter.updateOne(state.channelsStatus, {
        id: channelId,
        changes: {
          unread: false,
        },
      })
    },
    updateNewestMessage: (state, action: PayloadAction<UpdateNewestMessagePayload>) => {
      const { message } = action.payload
      publicChannelsStatusAdapter.updateOne(state.channelsStatus, {
        id: message.channelId,
        changes: {
          newestMessage: message,
        },
      })
    },
    // Utility action for testing purposes
    test_message: (
      state,
      action: PayloadAction<{
        message: ChannelMessage
        verifyAutomatically: boolean
      }>
    ) => {
      const { message } = action.payload
      const channel = state.channels.entities[message.channelId]
      if (!channel) return
      channelMessagesAdapter.addOne(channel.messages, message)
    },
    setNewMessageOpen: (state, action: PayloadAction<{ isOpen: boolean; prevChannelId?: string }>) => {
      const { isOpen, prevChannelId } = action.payload
      if (prevChannelId != null) {
        state.prevChannelId = prevChannelId
      }

      if (isOpen) {
        state.currentChannelId = EMPTY_CHANNEL_ID
      }
      state.newMessageOpen = isOpen
    },
  },
})

export const publicChannelsActions = publicChannelsSlice.actions
export const publicChannelsReducer = publicChannelsSlice.reducer
