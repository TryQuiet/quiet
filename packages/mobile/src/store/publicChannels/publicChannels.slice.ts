import Config from 'react-native-config';
import { createSlice, EntityState, PayloadAction } from '@reduxjs/toolkit';

import { StoreKeys } from '../store.keys';

import { publicChannelsAdapter } from './publicChannels.adapter';
import { IChannelInfo, IMessage } from './publicChannels.types';

export class PublicChannelsState {
  public channels: EntityState<IChannelInfo> =
    publicChannelsAdapter.getInitialState();

  public currentChannel: string = Config.PUBLIC_CHANNEL_ADDRESS;

  public channelMessages: ChannelMessages = {};
}

export interface ChannelMessages {
  [channelAddres: string]: {
    ids: string[];
    messages: {
      [id: string]: IMessage;
    };
  };
}

export interface GetPublicChannelsResponse {
  [name: string]: IChannelInfo;
}

export interface ChannelMessagesIdsResponse {
  channelAddress: string;
  ids: string[];
}

export interface AskForMessagesPayload {
  channelAddress: string;
  ids: string[];
}

export interface AskForMessagesResponse {
  channelAddress: string;
  messages: IMessage[];
}

export const publicChannelsSlice = createSlice({
  initialState: { ...new PublicChannelsState() },
  name: StoreKeys.PublicChannels,
  reducers: {
    getPublicChannels: state => state,
    responseGetPublicChannels: (
      state,
      action: PayloadAction<GetPublicChannelsResponse>,
    ) => {
      publicChannelsAdapter.setAll(
        state.channels,
        Object.values(action.payload),
      );
    },
    setCurrentChannel: (state, action: PayloadAction<string>) => {
      state.currentChannel = action.payload;
    },
    subscribeForTopic: (state, _action: PayloadAction<IChannelInfo>) => state,
    responseSendMessagesIds: (
      state,
      action: PayloadAction<ChannelMessagesIdsResponse>,
    ) => {
      const channelAddress = action.payload.channelAddress;
      if (channelAddress in state.channelMessages) {
        state.channelMessages[channelAddress].ids = action.payload.ids;
      } else {
        state.channelMessages[channelAddress] = {
          ids: action.payload.ids,
          messages: {},
        };
      }
    },
    askForMessages: (state, _action: PayloadAction<AskForMessagesPayload>) =>
      state,
    responseAskForMessages: (
      state,
      action: PayloadAction<AskForMessagesResponse>,
    ) => {
      const channelAddress = action.payload.channelAddress;
      action.payload.messages.forEach(message => {
        state.channelMessages[channelAddress].messages[message.id] = message;
      });
    },
    onMessagePosted: (state, action: PayloadAction<{ message: IMessage }>) => {
      const channelAddress = state.currentChannel;
      const message = action.payload.message;
      state.channelMessages[channelAddress].ids.push(message.id);
      state.channelMessages[channelAddress].messages[message.id] = message;
    },
  },
});

export const publicChannelsActions = publicChannelsSlice.actions;
export const publicChannelsReducer = publicChannelsSlice.reducer;
