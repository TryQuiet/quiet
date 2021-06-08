import { createSlice, EntityState, PayloadAction } from '@reduxjs/toolkit';

import { StoreKeys } from '../store.keys';

import {
  publicChannelMessagesAdapter,
  publicChannelsAdapter,
} from './publicChannels.adapter';
import { IMessage, IChannelInfo } from './publicChannels.types';

export class PublicChannelsState {
  public currentChannelAddress: string = '';
  public channels: EntityState<IChannelInfo> =
    publicChannelsAdapter.getInitialState();
  public messages: EntityState<IMessage> =
    publicChannelMessagesAdapter.getInitialState();
}

export interface ChannelInfoResponse {
  [name: string]: IChannelInfo;
}

export const publicChannelsSlice = createSlice({
  initialState: { ...new PublicChannelsState() },
  name: StoreKeys.PublicChannels,
  reducers: {
    fetchAllMessages: (state, _action: PayloadAction<string>) => state,
    responseFetchAllMessages: (
      state,
      action: PayloadAction<{
        channelAddress: string;
        messages: IMessage[];
      }>,
    ) => {
      publicChannelMessagesAdapter.setAll(
        state.messages,
        action.payload.messages,
      );
    },
    getPublicChannels: state => state,
    setCurrentChannelAddress: (state, action: PayloadAction<string>) => {
      state.currentChannelAddress = action.payload;
    },
    responseGetPublicChannels: (
      state,
      action: PayloadAction<ChannelInfoResponse>,
    ) => {
      publicChannelsAdapter.setAll(
        state.channels,
        Object.values(action.payload),
      );
    },
    subscribeForTopic: (state, _action: PayloadAction<IChannelInfo>) => state,
  },
});

export const publicChannelsActions = publicChannelsSlice.actions;
export const publicChannelsReducer = publicChannelsSlice.reducer;
