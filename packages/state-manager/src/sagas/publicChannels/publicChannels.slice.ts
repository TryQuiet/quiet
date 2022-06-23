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
  SendInitialChannelMessagePayload,
  GetPublicChannelsResponse,
  SetCurrentChannelPayload,
  SubscribeToTopicPayload,
  CacheMessagesPayload,
  MarkUnreadChannelPayload,
  SendNewUserInfoMessagePayload,
  SetChannelSubscribedPayload
} from './publicChannels.types'

import logger from '../../utils/logger'
import { Identity } from '../identity/identity.types'
const log = logger('publicChannels')

export class PublicChannelsState {
  public currentChannelAddress: string = 'general'

  public channels: EntityState<PublicChannelStorage> =
  publicChannelsAdapter.getInitialState()

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
    createGeneralChannel: state => state,
    sendInitialChannelMessage: (state, _action: PayloadAction<SendInitialChannelMessagePayload>) => state,
    sendNewUserInfoMessage: (state, _action: PayloadAction<SendNewUserInfoMessagePayload>) => state,
    addChannel: (state, action: PayloadAction<CreatedChannelResponse>) => {
      const { channel } = action.payload
      publicChannelsAdapter.addOne(state.channels, {
        ...channel,
        messages: channelMessagesAdapter.getInitialState()
      })
      publicChannelsStatusAdapter.addOne(state.channelsStatus, {
        address: channel.address,
        unread: false
      })
    },
    setChannelSubscribed: (state, action: PayloadAction<SetChannelSubscribedPayload>) => {
      const { channelAddress } = action.payload
      publicChannelsSubscriptionsAdapter.upsertOne(state.channelsSubscriptions, {
        address: channelAddress,
        subscribed: true
      })
    },
    responseGetPublicChannels: (state, action: PayloadAction<GetPublicChannelsResponse>) => {
      const { channels } = action.payload
      for (const channel of Object.values(channels)) {
        publicChannelsAdapter.upsertOne(state.channels, {
          ...channel,
          messages: channelMessagesAdapter.getInitialState()
        })
        publicChannelsStatusAdapter.addOne(state.channelsStatus, {
          address: channel.address,
          unread: false
        })
      }
    },
    setCurrentChannel: (state, action: PayloadAction<SetCurrentChannelPayload>) => {
      const { channelAddress } = action.payload
      state.currentChannelAddress = channelAddress
    },
    subscribeToTopic: (state, _action: PayloadAction<SubscribeToTopicPayload>) => state,
    subscribeToAllTopics: state => state,
    cacheMessages: (state, action: PayloadAction<CacheMessagesPayload>) => {
      const { messages, channelAddress } = action.payload
      channelMessagesAdapter.setAll(
        state.channels.entities[channelAddress].messages,
        messages
      )
    },
    markUnreadChannel: (state, action: PayloadAction<MarkUnreadChannelPayload>) => {
      const { channelAddress } = action.payload
      publicChannelsStatusAdapter.updateOne(
        state.channelsStatus,
        {
          id: channelAddress,
          changes: {
            unread: true
          }
        }
      )
    },
    clearUnreadChannel: (state, action: PayloadAction<MarkUnreadChannelPayload>) => {
      const { channelAddress } = action.payload
      publicChannelsStatusAdapter.updateOne(
        state.channelsStatus,
        {
          id: channelAddress,
          changes: {
            unread: false
          }
        }
      )
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
      channelMessagesAdapter.addOne(
        state.channels.entities[message.channelAddress].messages,
        message
      )
    }
  }
})

export const publicChannelsActions = publicChannelsSlice.actions
export const publicChannelsReducer = publicChannelsSlice.reducer
