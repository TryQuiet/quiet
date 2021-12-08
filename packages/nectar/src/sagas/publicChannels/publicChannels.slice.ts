import { createSlice, EntityState, PayloadAction } from '@reduxjs/toolkit';
import { StoreKeys } from '../store.keys';
import {
  publicChannelsAdapter,
  communityChannelsAdapter,
  channelMessagesAdapter,
} from './publicChannels.adapter';
import { PublicChannel, ChannelMessage } from './publicChannels.types';
import { MessageType } from '../messages/messages.types';
import { Identity } from '../identity/identity.slice';

import logger from '../../utils/logger';
const log = logger('publicChannels');

export class PublicChannelsState {
  public channels: EntityState<CommunityChannels> =
    communityChannelsAdapter.getInitialState();
}

export interface CommunityChannels {
  id: string;
  currentChannel: string;
  channels: EntityState<PublicChannel>;
  channelMessages: EntityState<ChannelMessage>;
  channelLoadingSlice: number;
}

export interface GetPublicChannelsResponse {
  communityId: string;
  channels: {
    [name: string]: PublicChannel;
  };
}

export interface ChannelMessagesIdsResponse {
  ids: string[];
  communityId: string;
}

export interface AskForMessagesPayload {
  peerId: string;
  communityId: string;
  channelAddress: string;
  ids: string[];
}

export interface SubscribeForTopicPayload {
  peerId: string;
  channelData: PublicChannel;
}

export interface AddPublicChannelsListPayload {
  id: string;
}

export interface SetCurrentChannelPayload {
  channel: string;
  communityId: string;
}

export interface SetChannelLoadingSlicePayload {
  slice: number;
  communityId: string;
}

export interface CreateChannelPayload {
  channel: PublicChannel;
  communityId: string;
}

export interface AskForMessagesResponse {
  messages: ChannelMessage[];
  communityId: string;
}

export interface OnMessagePostedResponse {
  message: ChannelMessage;
  communityId: string;
}

export const publicChannelsSlice = createSlice({
  initialState: {
    ...new PublicChannelsState(),
  },
  name: StoreKeys.PublicChannels,
  reducers: {
    createChannel: (state, action: PayloadAction<CreateChannelPayload>) => {
      const { channel, communityId } = action.payload;
      publicChannelsAdapter.addOne(
        state.channels.entities[communityId].channels,
        channel
      );
    },
    addChannel: (state, action: PayloadAction<CreateChannelPayload>) => {
      const { channel, communityId } = action.payload;
      publicChannelsAdapter.addOne(
        state.channels.entities[communityId].channels,
        channel
      );
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
        channelLoadingSlice: 0,
      };
      communityChannelsAdapter.addOne(state.channels, communityChannels);
    },
    getPublicChannels: (state) => state,
    responseGetPublicChannels: (
      state,
      action: PayloadAction<GetPublicChannelsResponse>
    ) => {
      const { communityId, channels } = action.payload;
      console.log(
        `replicated channels [${Object.keys(
          channels
        )}] for community ${communityId}`
      );
      publicChannelsAdapter.setAll(
        state.channels.entities[communityId].channels,
        channels
      );
    },
    setCurrentChannel: (
      state,
      action: PayloadAction<SetCurrentChannelPayload>
    ) => {
      const { communityId, channel } = action.payload;
      communityChannelsAdapter.updateOne(state.channels, {
        id: communityId,
        changes: { currentChannel: channel },
      });
    },
    setChannelLoadingSlice: (
      state,
      action: PayloadAction<SetChannelLoadingSlicePayload>
    ) => {
      const { communityId, slice } = action.payload;
      communityChannelsAdapter.updateOne(state.channels, {
        id: communityId,
        changes: { channelLoadingSlice: slice },
      });
    },
    subscribeForTopic: (
      state,
      _action: PayloadAction<SubscribeForTopicPayload>
    ) => state,
    subscribeForAllTopics: (state, _action: PayloadAction<string>) => state,
    responseSendMessagesIds: (
      state,
      action: PayloadAction<ChannelMessagesIdsResponse>
    ) => {
      const { communityId, ids } = action.payload;
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
            pubKey: '',
          };
          return message;
        }
      });
      channelMessagesAdapter.addMany(
        state.channels.entities[communityId].channelMessages,
        messages
      );
    },
    askForMessages: (state, _action: PayloadAction<AskForMessagesPayload>) =>
      state,
    responseAskForMessages: (
      state,
      action: PayloadAction<AskForMessagesResponse>
    ) => {
      const { communityId, messages } = action.payload;
      channelMessagesAdapter.upsertMany(
        state.channels.entities[communityId].channelMessages,
        messages
      );
    },
    onMessagePosted: (
      state,
      action: PayloadAction<OnMessagePostedResponse>
    ) => {
      const { message, communityId } = action.payload;
      channelMessagesAdapter.addOne(
        state.channels.entities[communityId].channelMessages,
        message
      );
    },
    // Utility action for testing purposes
    signMessage: (
      state,
      action: PayloadAction<{
        identity: Identity;
        message: ChannelMessage;
      }>
    ) => {
      const { identity, message } = action.payload;
      channelMessagesAdapter.addOne(
        // Identity should be the same as community id
        state.channels.entities[identity.id].channelMessages,
        message
      );
    },
  },
});

export const publicChannelsActions = publicChannelsSlice.actions;
export const publicChannelsReducer = publicChannelsSlice.reducer;
