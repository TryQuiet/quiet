import { createSlice, EntityState, PayloadAction } from '@reduxjs/toolkit'
import { StoreKeys } from '../store.keys'
import {
  publicChannelsAdapter,
  communityChannelsAdapter,
  channelMessagesAdapter,
  publicChannelsStatusAdapter,
  publicChannelsSubscriptionsAdapter
} from './publicChannels.adapter'
import {
  CommunityChannels,
  ChannelMessage,
  CreateChannelPayload,
  CreatedChannelResponse,
  CreateGeneralChannelPayload,
  SendInitialChannelMessagePayload,
  AddPublicChannelsListPayload,
  GetPublicChannelsResponse,
  SetCurrentChannelPayload,
  SubscribeToTopicPayload,
  CacheMessagesPayload,
  MarkUnreadChannelPayload,
  SendNewUserInfoMessagePayload,
  SetChannelSubscribedPayload
} from './publicChannels.types'
import { Identity } from '../identity/identity.types'

import logger from '../../utils/logger'
const log = logger('publicChannels')

export class PublicChannelsState {
  public channels: EntityState<CommunityChannels> = communityChannelsAdapter.getInitialState()
}

export const publicChannelsSlice = createSlice({
  initialState: {
    ...new PublicChannelsState()
  },
  name: StoreKeys.PublicChannels,
  reducers: {
    createChannel: (state, _action: PayloadAction<CreateChannelPayload>) => state,
    createGeneralChannel: (state, _action: PayloadAction<CreateGeneralChannelPayload>) => state,
    sendInitialChannelMessage: (state, _action: PayloadAction<SendInitialChannelMessagePayload>) => state,
    sendNewUserInfoMessage: (state, _action: PayloadAction<SendNewUserInfoMessagePayload>) => state,
    addPublicChannelsList: (state, action: PayloadAction<AddPublicChannelsListPayload>) => {
      const { id } = action.payload
      const communityChannels: CommunityChannels = {
        id: id,
        currentChannelAddress: 'general',
        channels: publicChannelsAdapter.getInitialState(),
        channelsStatus: publicChannelsStatusAdapter.getInitialState(),
        channelsSubscriptions: publicChannelsSubscriptionsAdapter.getInitialState()
      }
      communityChannelsAdapter.addOne(state.channels, communityChannels)
    },
    addChannel: (state, action: PayloadAction<CreatedChannelResponse>) => {
      const { channel, communityId } = action.payload
      publicChannelsAdapter.addOne(state.channels.entities[communityId].channels, {
        ...channel,
        messages: channelMessagesAdapter.getInitialState()
      })
      publicChannelsStatusAdapter.addOne(state.channels.entities[communityId].channelsStatus, {
        address: channel.address,
        unread: false
      })
    },
    setChannelSubscribed: (state, action: PayloadAction<SetChannelSubscribedPayload>) => {
      const { communityId, channelAddress } = action.payload
      publicChannelsSubscriptionsAdapter.upsertOne(state.channels.entities[communityId].channelsSubscriptions, {
        address: channelAddress,
        subscribed: true
      })
    },
    responseGetPublicChannels: (state, action: PayloadAction<GetPublicChannelsResponse>) => {
      const { channels, communityId } = action.payload
      for (const channel of Object.values(channels)) {
        publicChannelsAdapter.upsertOne(state.channels.entities[communityId].channels, {
          ...channel,
          messages: channelMessagesAdapter.getInitialState()
        })
        publicChannelsStatusAdapter.addOne(state.channels.entities[communityId].channelsStatus, {
          address: channel.address,
          unread: false
        })
      }
    },
    setCurrentChannel: (state, action: PayloadAction<SetCurrentChannelPayload>) => {
      const { communityId, channelAddress } = action.payload
      communityChannelsAdapter.updateOne(state.channels, {
        id: communityId,
        changes: {
          currentChannelAddress: channelAddress
        }
      })
    },
    subscribeToTopic: (state, _action: PayloadAction<SubscribeToTopicPayload>) => state,
    subscribeToAllTopics: state => state,
    cacheMessages: (state, action: PayloadAction<CacheMessagesPayload>) => {
      const { messages, channelAddress, communityId } = action.payload
      channelMessagesAdapter.setAll(
        state.channels.entities[communityId].channels.entities[channelAddress].messages,
        messages
      )
    },
    markUnreadChannel: (state, action: PayloadAction<MarkUnreadChannelPayload>) => {
      const { channelAddress, communityId } = action.payload
      publicChannelsStatusAdapter.updateOne(
        state.channels.entities[communityId].channelsStatus,
        {
          id: channelAddress,
          changes: {
            unread: true
          }
        }
      )
    },
    clearUnreadChannel: (state, action: PayloadAction<MarkUnreadChannelPayload>) => {
      const { channelAddress, communityId } = action.payload
      publicChannelsStatusAdapter.updateOne(
        state.channels.entities[communityId].channelsStatus,
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
        identity: Identity
        message: ChannelMessage
        verifyAutomatically: boolean
      }>
    ) => {
      const { identity, message } = action.payload
      channelMessagesAdapter.addOne(
        state.channels.entities[identity.id].channels.entities[message.channelAddress].messages,
        message
      )
    }
  }
})

export const publicChannelsActions = publicChannelsSlice.actions
export const publicChannelsReducer = publicChannelsSlice.reducer
