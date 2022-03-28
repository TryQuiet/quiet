import { createSlice, EntityState, PayloadAction } from '@reduxjs/toolkit'
import { StoreKeys } from '../store.keys'
import {
  publicChannelsAdapter,
  communityChannelsAdapter,
  channelMessagesAdapter
} from './publicChannels.adapter'
import { unreadMessagesAdapter } from './markUnreadMessages/unreadMessages.adapter'
import {
  CommunityChannels,
  ChannelMessage,
  CreateChannelPayload,
  CreateGeneralChannelPayload,
  AddPublicChannelsListPayload,
  GetPublicChannelsResponse,
  SetCurrentChannelPayload,
  SetChannelMessagesSliceValuePayload,
  ChannelMessagesIdsResponse,
  SubscribeToTopicPayload,
  AskForMessagesPayload,
  IncomingMessages,
  MarkUnreadMessagesPayload,
  ClearUnreadMessagesPayload,
  CreatedChannelResponse,
  CacheChannelScrollPositionPayload
} from './publicChannels.types'
import { MessageType } from '../messages/messages.types'
import { Identity } from '../identity/identity.types'
import logger from '../../utils/logger'

const log = logger('publicChannels')

export class PublicChannelsState {
  public channels: EntityState<CommunityChannels> =
  communityChannelsAdapter.getInitialState()
}

export const publicChannelsSlice = createSlice({
  initialState: {
    ...new PublicChannelsState()
  },
  name: StoreKeys.PublicChannels,
  reducers: {
    createChannel: (state, _action: PayloadAction<CreateChannelPayload>) => state,
    createGeneralChannel: (state, _action: PayloadAction<CreateGeneralChannelPayload>) => state,
    addChannel: (state, action: PayloadAction<CreatedChannelResponse>) => {
      const { channel, communityId } = action.payload
      publicChannelsAdapter.addOne(
        state.channels.entities[communityId].channels,
        channel
      )
    },
    addPublicChannelsList: (
      state,
      action: PayloadAction<AddPublicChannelsListPayload>
    ) => {
      const communityChannels: CommunityChannels = {
        id: action.payload.id,
        currentChannel: 'general',
        channels: publicChannelsAdapter.getInitialState(),
        channelMessages: channelMessagesAdapter.getInitialState(),
        unreadMessages: unreadMessagesAdapter.getInitialState()
      }
      communityChannelsAdapter.addOne(state.channels, communityChannels)
    },
    responseGetPublicChannels: (
      state,
      action: PayloadAction<GetPublicChannelsResponse>
    ) => {
      const { communityId, channels } = action.payload
      log(
        `replicated channels [${Object.keys(
          channels
        )}] for community ${communityId}`
      )
      publicChannelsAdapter.upsertMany(
        state.channels.entities[communityId].channels,
        channels
      )
    },
    setCurrentChannel: (
      state,
      action: PayloadAction<SetCurrentChannelPayload>
    ) => {
      const { communityId, channelAddress } = action.payload
      communityChannelsAdapter.updateOne(state.channels, {
        id: communityId,
        changes: { currentChannel: channelAddress }
      })
    },
    setChannelMessagesSliceValue: (
      state,
      action: PayloadAction<SetChannelMessagesSliceValuePayload>
    ) => {
      const { messagesSlice, channelAddress, communityId } = action.payload

      // Verify community exists in redux store
      if (!state.channels.entities[communityId]) return

      publicChannelsAdapter.updateOne(
        state.channels.entities[communityId].channels,
        {
          id: channelAddress,
          changes: {
            messagesSlice: messagesSlice
          }
        }
      )
    },
    cacheChannelScrollPosition: (
      state,
      action: PayloadAction<CacheChannelScrollPositionPayload>
    ) => {
      const { scrollPosition, channelAddress, communityId } = action.payload

      // Verify community exists in redux store
      if (!state.channels.entities[communityId]) return

      publicChannelsAdapter.updateOne(
        state.channels.entities[communityId].channels,
        {
          id: channelAddress,
          changes: {
            scrollPosition: scrollPosition
          }
        }
      )
    },
    subscribeToTopic: (
      state,
      _action: PayloadAction<SubscribeToTopicPayload>
    ) => state,
    subscribeToAllTopics: state => state,
    responseSendMessagesIds: (
      state,
      action: PayloadAction<ChannelMessagesIdsResponse>
    ) => {
      const { communityId, ids } = action.payload
      const messages = ids.map((id) => {
        /* There comes all of the message's ids from public channels...
        ...add objects only for the ids that are not already present in the store */
        if (!(id in state.channels.entities[communityId].channelMessages.ids)) {
          const message: ChannelMessage = {
            id: id,
            type: MessageType.Empty,
            message: '',
            createdAt: 0,
            channelAddress: '',
            signature: '',
            pubKey: ''
          }
          return message
        }
      })
      channelMessagesAdapter.addMany(
        state.channels.entities[communityId].channelMessages,
        messages
      )
    },
    askForMessages: (state, _action: PayloadAction<AskForMessagesPayload>) =>
      state,
    incomingMessages: (
      state,
      action: PayloadAction<IncomingMessages>
    ) => {
      const { messages, communityId } = action.payload
      channelMessagesAdapter.upsertMany(
        state.channels.entities[communityId].channelMessages,
        messages
      )
    },
    markUnreadMessages: (
      state,
      action: PayloadAction<MarkUnreadMessagesPayload>
    ) => {
      const { messages, communityId } = action.payload
      unreadMessagesAdapter.upsertMany(
        state.channels.entities[communityId].unreadMessages,
        messages
      )
    },
    clearUnreadMessages: (
      state,
      action: PayloadAction<ClearUnreadMessagesPayload>
    ) => {
      const { ids, communityId } = action.payload
      unreadMessagesAdapter.removeMany(
        state.channels.entities[communityId].unreadMessages,
        ids
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
        state.channels.entities[identity.id].channelMessages,
        message
      )
    }
  }
})

export const publicChannelsActions = publicChannelsSlice.actions
export const publicChannelsReducer = publicChannelsSlice.reducer
