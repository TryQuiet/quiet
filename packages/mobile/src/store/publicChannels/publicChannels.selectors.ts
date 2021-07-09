import { Config } from 'react-native-config';
import { StoreKeys } from '../store.keys';
import { createSelector } from 'reselect';
import { selectReducer } from '../store.utils';
import { publicChannelsAdapter } from './publicChannels.adapter';
import { formatMessageDisplayDate } from '../../utils/functions/formatMessageDisplayDate/formatMessageDisplayDate';

export const publicChannels = createSelector(
  selectReducer(StoreKeys.PublicChannels),
  reducerState => {
    return publicChannelsAdapter
      .getSelectors()
      .selectAll(reducerState.channels);
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

export const currentChannel = createSelector(
  selectReducer(StoreKeys.PublicChannels),
  reducerState => {
    return reducerState.currentChannel;
  },
);

export const channelMessages = createSelector(
  selectReducer(StoreKeys.PublicChannels),
  reducerState => {
    return reducerState.channelMessages;
  },
);

export const currentChannelMessagesKeys = createSelector(
  currentChannel,
  channelMessages,
  (address, messages) => {
    if (messages && address in messages) {
      return messages[address].ids;
    } else {
      return <string[]>[];
    }
  },
);

export const currentChannelMessages = createSelector(
  currentChannel,
  channelMessages,
  (address, messages) => {
    if (messages && address in messages) {
      return messages[address].messages;
    } else {
      return {};
    }
  },
);

export const orderedChannelMessages = createSelector(
  currentChannelMessagesKeys,
  currentChannelMessages,
  (keys, messages) => {
    return keys
      .filter(key => key in messages)
      .map(key => {
        return messages[key];
      });
  },
);

export const missingCurrentChannelMessages = createSelector(
  currentChannelMessagesKeys,
  currentChannelMessages,
  (ids, messages) => {
    return ids.filter(id => !(id in messages));
  },
);

export const currentChannelDisplayableMessages = createSelector(
  orderedChannelMessages,
  messages =>
    messages.map(message => {
      return {
        id: message.id,
        message: message.message,
        nickname: 'anon',
        datetime: formatMessageDisplayDate(message.createdAt),
      };
    }),
);

export const publicChannelsSelectors = {
  publicChannels,
  ZbayChannel,
  currentChannel,
  channelMessages,
  currentChannelMessages,
  orderedChannelMessages,
  missingCurrentChannelMessages,
  currentChannelDisplayableMessages,
};
