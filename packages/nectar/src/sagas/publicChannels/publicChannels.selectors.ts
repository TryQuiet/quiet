import { createSelector } from 'reselect';
import { StoreKeys } from '../store.keys';
import {
  publicChannelsAdapter,
  channelsByCommunityAdapter,
} from './publicChannels.adapter';
import { CreatedSelectors } from '../store.types';
import { formatMessageDisplayDate } from '../../utils/functions/formatMessageDisplayDate/formatMessageDisplayDate';
import { certificatesMapping } from '../users/users.selectors';
import { mainChannelName } from '../config';
import { StoreState } from '../store.types';
import { currentCommunityId } from '../communities/communities.selectors';


const publicChannelSlice: CreatedSelectors[StoreKeys.PublicChannels] = (
  state: StoreState
) => state[StoreKeys.PublicChannels];

export const currentCommunityChannels = createSelector(
  publicChannelSlice,
  currentCommunityId,
  (publicChannelsState, id) => {
    const selected = channelsByCommunityAdapter
      .getSelectors()
      .selectById(publicChannelsState, id);
    return selected || null;
  }
);

export const publicChannels = createSelector(
  currentCommunityChannels,
  (channels) => {
    if (channels) {
      return publicChannelsAdapter.getSelectors().selectAll(channels.channels);
    }
    return [];
  }
);

export const publicChannelsByCommunityId = (id: string) => createSelector(publicChannelSlice,
  (publicChannelsState) => {
    const selected = channelsByCommunityAdapter
    .getSelectors()
    .selectById(publicChannelsState, id);
    const channels = publicChannelsAdapter.getSelectors().selectAll(selected.channels)
    return channels || []
  }
)


export const ZbayChannel = createSelector(
  currentCommunityChannels,
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
  currentCommunityChannels,
  (reducerState) => {
    return reducerState?.currentChannel || null;
  }
);

export const channelMessages = createSelector(
  currentCommunityChannels,
  (reducerState) => {
    return reducerState?.channelMessages || null;
  }
);

export const currentChannelMessagesKeys = createSelector(
  currentChannel,
  channelMessages,
  (address, messages) => {
    // @ts-ignore
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
    // @ts-ignore
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
  publicChannelsByCommunityId,
  ZbayChannel,
  currentChannel,
  channelMessages,
  currentChannelMessages,
  orderedChannelMessages,
  missingCurrentChannelMessages,
  validCurrentChannelMessages,
  currentChannelDisplayableMessages,
};
