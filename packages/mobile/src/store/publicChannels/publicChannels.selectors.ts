import { Config } from 'react-native-config';
import { createSelector } from 'reselect';
import { formatMessageDisplayDate } from '../../utils/functions/formatMessageDisplayDate/formatMessageDisplayDate';
import { StoreKeys } from '../store.keys';
import { selectReducer } from '../store.utils';
import {
  publicChannelMessagesAdapter,
  publicChannelsAdapter,
} from './publicChannels.adapter';
import { DisplayableMessage } from './publicChannels.types';

export const publicChannels = createSelector(
  selectReducer(StoreKeys.PublicChannels),
  reducerState => {
    return publicChannelsAdapter
      .getSelectors()
      .selectAll(reducerState.channels);
  },
);

export const currentChannelMessages = createSelector(
  selectReducer(StoreKeys.PublicChannels),
  reducerState =>
    publicChannelMessagesAdapter
      .getSelectors()
      .selectAll(reducerState.messages),
);

export const formattedChannelMessages = createSelector(
  currentChannelMessages,
  messages => {
    var result: DisplayableMessage[] = [];
    messages.forEach(message => {
      const displayableMessage: DisplayableMessage = {
        message: message,
        nickname: 'anon',
        datetime: formatMessageDisplayDate(message.createdAt),
      };
      result.push(displayableMessage);
    });
    return result.sort((a, b) => b.message.createdAt - a.message.createdAt);
  },
);

export const ZbayChannel = createSelector(
  selectReducer(StoreKeys.PublicChannels),
  reducerState => {
    const publicChannelsList = publicChannelsAdapter
      .getSelectors()
      .selectAll(reducerState.channels);

    return publicChannelsList.find(
      channel => channel.address === Config.PUBLIC_CHANNEL_ADDRESS,
    );
  },
);

export const publicChannelsSelectors = {
  publicChannels,
  currentChannelMessages,
  formattedChannelMessages,
  ZbayChannel,
};
