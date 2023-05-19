import { createSlice, EntityState, PayloadAction } from '@reduxjs/toolkit'
import { StoreKeys } from '../store.keys'
import {
  publicChannelsAdapter,
  channelMessagesAdapter,
  publicChannelsStatusAdapter,
  publicChannelsSubscriptionsAdapter
} from './publicChannels.adapter'
import {
  PublicChannelStorage,
  PublicChannelStatus,
  PublicChannelSubscription,
  ChannelMessage,
  CreateChannelPayload,
  CreatedChannelResponse,
  ChannelsReplicatedPayload,
  SendInitialChannelMessagePayload,
  SetCurrentChannelPayload,
  CacheMessagesPayload,
  MarkUnreadChannelPayload,
  SendNewUserInfoMessagePayload,
  SetChannelSubscribedPayload,
  UpdateNewestMessagePayload,
  DeleteChannelPayload,
  ChannelDeletionResponsePayload,
  DeleteChannelFromStorePayload,
  ClearMessagesCachePayload,
  DisableChannelPayload,
  INITIAL_CURRENT_CHANNEL_ID
} from './publicChannels.types'

import logger from '../../utils/logger'
import { Identity } from '../identity/identity.types'
const log = logger('publicChannels')

export class PublicChannelsState {
  public currentchannelId: string = INITIAL_CURRENT_CHANNEL_ID

  public pendingGeneralChannelRecreation: boolean = false

  public channels: EntityState<PublicChannelStorage> = publicChannelsAdapter.getInitialState()

  public channelsStatus: EntityState<PublicChannelStatus> =
    publicChannelsStatusAdapter.getInitialState()

  public channelsSubscriptions: EntityState<PublicChannelSubscription> =
    publicChannelsSubscriptionsAdapter.getInitialState()
}

export const publicChannelsSlice = createSlice({
  initialState: { ...new PublicChannelsState() },
  name: StoreKeys.PublicChannels,
  reducers: {
    createChannel: (state, _action: PayloadAction<CreateChannelPayload>) => state,
    deleteChannel: (state, _action: PayloadAction<DeleteChannelPayload>) => state,
    channelDeletionResponse: (state, _action: PayloadAction<ChannelDeletionResponsePayload>) =>
      state,
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
          disabled: true
        }
      })
    },
    clearMessagesCache: (state, action: PayloadAction<ClearMessagesCachePayload>) => {
      const { channelId } = action.payload
      console.log('clearMessagesCache', action.payload)
      channelMessagesAdapter.setAll(state.channels.entities[channelId].messages, [])
    },
    startGeneralRecreation: state => {
      state.pendingGeneralChannelRecreation = true
    },
    finishGeneralRecreation: state => {
      state.pendingGeneralChannelRecreation = false
    },
    createGeneralChannel: state => state,
    sendInitialChannelMessage: (state, _action: PayloadAction<SendInitialChannelMessagePayload>) =>
      state,
    sendNewUserInfoMessage: (state, _action: PayloadAction<SendNewUserInfoMessagePayload>) => state,
    addChannel: (state, action: PayloadAction<CreatedChannelResponse>) => {
      const { channel } = action.payload
      publicChannelsAdapter.addOne(state.channels, {
        ...channel,
        messages: channelMessagesAdapter.getInitialState()
      })
      publicChannelsStatusAdapter.addOne(state.channelsStatus, {
        id: channel.id,
        unread: false,
        newestMessage: null
      })
    },
    setChannelSubscribed: (state, action: PayloadAction<SetChannelSubscribedPayload>) => {
      const { channelId } = action.payload
      publicChannelsSubscriptionsAdapter.upsertOne(state.channelsSubscriptions, {
        id: channelId,
        subscribed: true
      })
    },
    channelsReplicated: (state, _action: PayloadAction<ChannelsReplicatedPayload>) => state,
    setCurrentChannel: (state, action: PayloadAction<SetCurrentChannelPayload>) => {
      const { channelId } = action.payload
      state.currentchannelId = channelId
    },
    cacheMessages: (state, action: PayloadAction<CacheMessagesPayload>) => {
      const { messages, channelId } = action.payload
      channelMessagesAdapter.setAll(state.channels.entities[channelId].messages, messages)
    },

    markUnreadChannel: (state, action: PayloadAction<MarkUnreadChannelPayload>) => {
      const { channelId } = action.payload
      publicChannelsStatusAdapter.updateOne(state.channelsStatus, {
        id: channelId,
        changes: {
          unread: true
        }
      })
    },
    clearUnreadChannel: (state, action: PayloadAction<MarkUnreadChannelPayload>) => {
      const { channelId } = action.payload
      publicChannelsStatusAdapter.updateOne(state.channelsStatus, {
        id: channelId,
        changes: {
          unread: false
        }
      })
    },
    updateNewestMessage: (state, action: PayloadAction<UpdateNewestMessagePayload>) => {
      const { message } = action.payload
      publicChannelsStatusAdapter.updateOne(state.channelsStatus, {
        id: message.channelId,
        changes: {
          newestMessage: message
        }
      })
    },
    // Utility action for testing purposes
    test_message: (
      state,
      action: PayloadAction<{
        message: ChannelMessage
        identity: Identity
        verifyAutomatically: boolean
      }>
    ) => {
      const { message } = action.payload
      console.log({ message })
      channelMessagesAdapter.addOne(
        state.channels.entities[message.channelId].messages,
        message
      )
    }
  }
})

export const publicChannelsActions = publicChannelsSlice.actions
export const publicChannelsReducer = publicChannelsSlice.reducer
