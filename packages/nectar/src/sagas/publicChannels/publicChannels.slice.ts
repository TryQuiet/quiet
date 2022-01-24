import { createSlice, EntityState, PayloadAction } from '@reduxjs/toolkit'
import { StoreKeys } from '../store.keys'
import {
  publicChannelsAdapter,
  communityChannelsAdapter,
  channelMessagesAdapter
} from './publicChannels.adapter'
import {
  PublicChannel,
  ChannelMessage,
  CreateChannelPayload,
  CreateGeneralChannelPayload,
  AddPublicChannelsListPayload,
  GetPublicChannelsResponse,
  SetCurrentChannelPayload,
  SetChannelLoadingSlicePayload,
  ChannelMessagesIdsResponse,
  SubscribeToTopicPayload,
  OnMessagePostedResponse,
  AskForMessagesResponse,
  AskForMessagesPayload
} from './publicChannels.types'
import { MessageType } from '../messages/messages.types'
import { Identity } from '../identity/identity.types'
import logger from '../../utils/logger'

const log = logger('publicChannels')

export class PublicChannelsState {
  public channels: EntityState<CommunityChannels> =
  communityChannelsAdapter.getInitialState()
}

export interface CommunityChannels {
  id: string
  currentChannel: string
  channels: EntityState<PublicChannel>
  channelMessages: EntityState<ChannelMessage>
  channelLoadingSlice: number
}

export const publicChannelsSlice = createSlice({
  initialState: {
    ...new PublicChannelsState()
  },
  name: StoreKeys.PublicChannels,
  reducers: {
    createChannel: (state, _action: PayloadAction<CreateChannelPayload>) => state,
    createGeneralChannel: (state, _action: PayloadAction<CreateGeneralChannelPayload>) => state,
    addChannel: (state, action: PayloadAction<CreateChannelPayload>) => {
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
        channelLoadingSlice: 0
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
      const { communityId, channel } = action.payload
      communityChannelsAdapter.updateOne(state.channels, {
        id: communityId,
        changes: { currentChannel: channel }
      })
    },
    setChannelLoadingSlice: (
      state,
      action: PayloadAction<SetChannelLoadingSlicePayload>
    ) => {
      const { communityId, slice } = action.payload
      communityChannelsAdapter.updateOne(state.channels, {
        id: communityId,
        changes: { channelLoadingSlice: slice }
      })
    },
    subscribeToTopic: (
      state,
      _action: PayloadAction<SubscribeToTopicPayload>
    ) => state,
    subscribeToAllTopics: (state, _action: PayloadAction<string>) => state,
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
            channelId: '',
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
    responseAskForMessages: (
      state,
      action: PayloadAction<AskForMessagesResponse>
    ) => {
      const { communityId, messages } = action.payload
      channelMessagesAdapter.upsertMany(
        state.channels.entities[communityId].channelMessages,
        messages
      )
    },
    onMessagePosted: (
      state,
      action: PayloadAction<OnMessagePostedResponse>
    ) => {
      const { message, communityId } = action.payload
      channelMessagesAdapter.addOne(
        state.channels.entities[communityId].channelMessages,
        message
      )
    },
    // Utility action for testing purposes
    test_message: (
      state,
      action: PayloadAction<{
        identity: Identity
        message: ChannelMessage
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
