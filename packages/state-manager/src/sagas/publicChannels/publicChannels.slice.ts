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
  DisableChannelPayload
} from './publicChannels.types'

import logger from '../../utils/logger'
import { Identity } from '../identity/identity.types'
const log = logger('publicChannels')

export class PublicChannelsState {
  public currentChannelAddress: string = 'general'
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
      const { channelAddress } = action.payload

      publicChannelsSubscriptionsAdapter.removeOne(state.channelsSubscriptions, channelAddress)
      publicChannelsStatusAdapter.removeOne(state.channelsStatus, channelAddress)
      publicChannelsAdapter.removeOne(state.channels, channelAddress)
    },
    disableChannel: (state, action: PayloadAction<DisableChannelPayload>) => {
      const { channelAddress } = action.payload
      publicChannelsAdapter.updateOne(state.channels, {
        id: channelAddress,
        changes: {
          disabled: true
        }
      })
    },
    clearMessagesCache: (state, action: PayloadAction<ClearMessagesCachePayload>) => {
      const { channelAddress } = action.payload
      const channel = state.channels.entities[channelAddress]
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
        address: channel.address,
        unread: false,
        newestMessage: null
      })
    },
    setChannelSubscribed: (state, action: PayloadAction<SetChannelSubscribedPayload>) => {
      const { channelAddress } = action.payload
      publicChannelsSubscriptionsAdapter.upsertOne(state.channelsSubscriptions, {
        address: channelAddress,
        subscribed: true
      })
    },
    channelsReplicated: (state, _action: PayloadAction<ChannelsReplicatedPayload>) => state,
    setCurrentChannel: (state, action: PayloadAction<SetCurrentChannelPayload>) => {
      const { channelAddress } = action.payload
      state.currentChannelAddress = channelAddress
    },
    cacheMessages: (state, action: PayloadAction<CacheMessagesPayload>) => {
      const { messages, channelAddress } = action.payload
      const channel = state.channels.entities[channelAddress]
      if (!channel) return
      channelMessagesAdapter.setAll(channel.messages, messages)
    },

    markUnreadChannel: (state, action: PayloadAction<MarkUnreadChannelPayload>) => {
      const { channelAddress } = action.payload
      publicChannelsStatusAdapter.updateOne(state.channelsStatus, {
        id: channelAddress,
        changes: {
          unread: true
        }
      })
    },
    clearUnreadChannel: (state, action: PayloadAction<MarkUnreadChannelPayload>) => {
      const { channelAddress } = action.payload
      publicChannelsStatusAdapter.updateOne(state.channelsStatus, {
        id: channelAddress,
        changes: {
          unread: false
        }
      })
    },
    updateNewestMessage: (state, action: PayloadAction<UpdateNewestMessagePayload>) => {
      const { message } = action.payload
      publicChannelsStatusAdapter.updateOne(state.channelsStatus, {
        id: message.channelAddress,
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
      const channel = state.channels.entities[message.channelAddress]
      if (!channel) return
      channelMessagesAdapter.addOne(
        channel.messages,
        message
      )
    }
  }
})

export const publicChannelsActions = publicChannelsSlice.actions
export const publicChannelsReducer = publicChannelsSlice.reducer
