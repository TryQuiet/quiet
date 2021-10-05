import { StoreKeys } from '../store.keys';
import { createSelector } from 'reselect';
import { CreatedSelectors } from '../store.types'
import { publicChannelsAdapter } from './publicChannels.adapter';
import { formatMessageDisplayDate } from '../../utils/functions/formatMessageDisplayDate/formatMessageDisplayDate';
import { certificatesMapping } from '../users/users.selectors';
import { mainChannelName } from '../config';
import { StoreState } from '../store.types';

const publicChannelSlice: CreatedSelectors[StoreKeys.PublicChannels] = (state: StoreState) => state[StoreKeys.PublicChannels]

export const publicChannels = createSelector(
  publicChannelSlice,
  (reducerState) => {
    return publicChannelsAdapter
      .getSelectors()
      .selectAll(reducerState.channels);
  }
);

export const ZbayChannel = createSelector(
  publicChannelSlice,
  (reducerState) => {
    const publicChannelsList = publicChannelsAdapter
      .getSelectors()
      .selectAll(reducerState.channels);

    return publicChannelsList.find(
      (channel) => channel.address === mainChannelName
    );
  }
);

export const currentChannel = createSelector(
  publicChannelSlice,
  (reducerState) => {
    return reducerState.currentChannel;
  }
);

export const channelMessages = createSelector(
  publicChannelSlice,
  (reducerState) => {
    return reducerState.channelMessages;
  }
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
  }
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
  }
);

export const orderedChannelMessages = createSelector(
  currentChannelMessagesKeys,
  currentChannelMessages,
  (keys, messages) => {
    return keys
      .filter((key) => key in messages)
      .map((key) => {
        return messages[key];
      });
  }
);

export const missingCurrentChannelMessages = createSelector(
  currentChannelMessagesKeys,
  currentChannelMessages,
  (ids, messages) => {
    return ids.filter((id) => !(id in messages));
  }
);

export const validCurrentChannelMessages = createSelector(
  orderedChannelMessages,
  certificatesMapping,
  (messages, certificates) => {
    return messages
      .filter((message) => message.pubKey in certificates)
      .sort((a, b) => {
        return b.createdAt - a.createdAt;
      });
  }
);

export const currentChannelDisplayableMessages = createSelector(
  validCurrentChannelMessages,
  certificatesMapping,
  (messages, certificates) => {
    return messages.map((message) => {
      const user = certificates[message.pubKey];
      return {
        id: message.id,
        type: message.type,
        message: message.message,
        createdAt: formatMessageDisplayDate(message.createdAt),
        nickname: user.username,
      };
    });
  }
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
