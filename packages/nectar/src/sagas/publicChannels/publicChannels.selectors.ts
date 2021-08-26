import { createSelector } from 'reselect';
import { StoreKeys } from '../store.keys';
import { selectReducer } from '../store.utils';
import { publicChannelsAdapter } from './publicChannels.adapter';
import { formatMessageDisplayDate } from '../../utils/functions/formatMessageDisplayDate/formatMessageDisplayDate';
import { certificatesMapping } from '../users/users.selectors';

export const publicChannels = createSelector(
  selectReducer(StoreKeys.PublicChannels),
  (reducerState) =>
    publicChannelsAdapter.getSelectors().selectAll(reducerState.channels)
);

// TODO: Change to general channel - created by default on community creation
export const ZbayChannel = createSelector(
  selectReducer(StoreKeys.PublicChannels),
  (reducerState) => {
    const publicChannelsList = publicChannelsAdapter
      .getSelectors()
      .selectAll(reducerState.channels);

    return publicChannelsList.find(
      (channel) =>
        channel.address ===
        'zs10zkaj29rcev9qd5xeuzck4ly5q64kzf6m6h9nfajwcvm8m2vnjmvtqgr0mzfjywswwkwke68t00'
    );
  }
);

export const currentChannel = createSelector(
  selectReducer(StoreKeys.PublicChannels),
  (reducerState) => reducerState.currentChannel
);

export const channelMessages = createSelector(
  selectReducer(StoreKeys.PublicChannels),
  (reducerState) => reducerState.channelMessages
);

export const currentChannelMessagesKeys = createSelector(
  currentChannel,
  channelMessages,
  (address, messages) => {
    if (messages && address in messages) {
      return messages[address].ids;
    }
    return <string[]>[];
  }
);

export const currentChannelMessages = createSelector(
  currentChannel,
  channelMessages,
  (address, messages) => {
    if (messages && address in messages) {
      return messages[address].messages;
    }
    return {};
  }
);

export const orderedChannelMessages = createSelector(
  currentChannelMessagesKeys,
  currentChannelMessages,
  (keys: string[], messages) =>
    keys.filter((key) => key in messages).map((key) => messages[key])
);

export const missingCurrentChannelMessages = createSelector(
  currentChannelMessagesKeys,
  currentChannelMessages,
  (ids: string[], messages) => ids.filter((id) => !(id in messages))
);

export const validCurrentChannelMessages = createSelector(
  orderedChannelMessages,
  certificatesMapping,
  (messages, certificates) =>
    messages
      .filter((message) => message.pubKey in certificates)
      .sort((a, b) => b.createdAt - a.createdAt)
);

export const currentChannelDisplayableMessages = createSelector(
  validCurrentChannelMessages,
  certificatesMapping,
  (messages, certificates) =>
    messages.map((message) => {
      const user = certificates[message.pubKey];
      return {
        id: message.id,
        type: message.type,
        message: message.message,
        createdAt: formatMessageDisplayDate(message.createdAt),
        nickname: user.username,
      };
    })
);

export const publicChannelsSelectors = {
  publicChannels,
  ZbayChannel,
  currentChannel,
  channelMessages,
  currentChannelMessages,
  orderedChannelMessages,
  missingCurrentChannelMessages,
  validCurrentChannelMessages,
  currentChannelDisplayableMessages,
};