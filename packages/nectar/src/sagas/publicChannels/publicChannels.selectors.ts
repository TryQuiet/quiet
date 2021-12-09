import { createSelector } from 'reselect';
import { StoreKeys } from '../store.keys';
import {
  publicChannelsAdapter,
  communityChannelsAdapter,
  channelMessagesAdapter,
} from './publicChannels.adapter';
import { CreatedSelectors } from '../store.types';
import { certificatesMapping } from '../users/users.selectors';
import { StoreState } from '../store.types';
import { currentCommunityId } from '../communities/communities.selectors';
import { MessageType } from '../messages/messages.types';
import { CommunityChannels } from './publicChannels.slice';
import { DisplayableMessage } from '../..';
import { formatMessageDisplayDate } from '../../utils/functions/dates/formatMessageDisplayDate';

const publicChannelSlice: CreatedSelectors[StoreKeys.PublicChannels] = (
  state: StoreState
) => state[StoreKeys.PublicChannels];

export const selectEntities = createSelector(
  publicChannelSlice,
  (reducerState) =>
    communityChannelsAdapter
      .getSelectors()
      .selectEntities(reducerState.channels)
);

export const publicChannelsByCommunity = (id: string) =>
  createSelector(selectEntities, (publicChannels) => {
    const community = publicChannels[id];
    return publicChannelsAdapter.getSelectors().selectAll(community.channels);
  });

const currentCommunityChannelsState = createSelector(
  selectEntities,
  currentCommunityId,
  (publicChannels, currentCommunity) => {
    const empty: CommunityChannels = {
      id: '',
      currentChannel: '',
      channels: publicChannelsAdapter.getInitialState(),
      channelMessages: channelMessagesAdapter.getInitialState(),
      channelLoadingSlice: 0,
    };
    return publicChannels[currentCommunity] || empty;
  }
);

export const publicChannels = createSelector(
  currentCommunityChannelsState,
  (state) => {
    return publicChannelsAdapter.getSelectors().selectAll(state.channels);
  }
);

export const publicChannelsMessages = createSelector(
  currentCommunityChannelsState,
  (state) => {
    return channelMessagesAdapter
      .getSelectors()
      .selectAll(state.channelMessages);
  }
);

export const missingChannelsMessages = createSelector(
  publicChannelsMessages,
  (messages) => {
    return messages
      .filter((message) => message.type === MessageType.Empty)
      .map((message) => message.id);
  }
);

export const currentChannel = createSelector(
  currentCommunityChannelsState,
  (state) => {
    return state.currentChannel;
  }
);

export const channelLoadingSlice = createSelector(
  currentCommunityChannelsState,
  (state) => {
    return state.channelLoadingSlice;
  }
);

export const currentChannelMessages = createSelector(
  publicChannelsMessages,
  currentChannel,
  (messages, channel) => {
    return messages.filter((message) => message.channelId === channel);
  }
);

const validCurrentChannelMessages = createSelector(
  currentChannelMessages,
  certificatesMapping,
  (messages, certificates) => {
    return messages.filter((message) => message.pubKey in certificates);
  }
);

export const sortedCurrentChannelMessages = createSelector(
  validCurrentChannelMessages,
  (messages) => {
    return messages.sort((a, b) => b.createdAt - a.createdAt).reverse();
  }
);

export const slicedCurrentChannelMessages = createSelector(
  sortedCurrentChannelMessages,
  channelLoadingSlice,
  (messages, slice) => {
    return messages.slice(slice, messages.length);
  }
);

export const currentChannelMessagesCount = createSelector(
  slicedCurrentChannelMessages,
  (messages) => {
    return messages.length;
  }
);

const displayableCurrentChannelMessages = createSelector(
  slicedCurrentChannelMessages,
  certificatesMapping,
  (messages, certificates) =>
    messages.map((message) => {
      const user = certificates[message.pubKey];
      const date = formatMessageDisplayDate(message.createdAt);
      const displayableMessage: DisplayableMessage = {
        id: message.id,
        type: message.type,
        message: message.message,
        createdAt: message.createdAt,
        date: date,
        nickname: user.username,
      };
      return displayableMessage;
    })
);

export const dailyGroupedCurrentChannelMessages = createSelector(
  displayableCurrentChannelMessages,
  (messages) => {
    const result: { [date: string]: DisplayableMessage[] } = messages.reduce(
      (groups, message) => {
        let date: string;

        if (message.date.includes(',')) {
          date = message.date.split(',')[0];
        } else {
          date = 'Today';
        }

        if (!groups[date]) {
          groups[date] = [];
        }

        groups[date].push(message);
        return groups;
      },
      {}
    );

    return result;
  }
);

export const currentChannelMessagesMergedBySender = createSelector(
  dailyGroupedCurrentChannelMessages,
  (groups) => {
    let result: { [day: string]: DisplayableMessage[][] } = {};
    for (const day in groups) {
      result[day] = groups[day].reduce((merged, message) => {
        // Get last item from collected array for comparison
        const last = merged.length && merged[merged.length - 1][0];

        if (
          last.nickname === message.nickname &&
          last.createdAt - message.createdAt < 300
        ) {
          merged[merged.length - 1].push(message);
        } else {
          merged.push([message]);
        }

        return merged;
      }, []);
    }

    return result;
  }
);

export const publicChannelsSelectors = {
  publicChannelsByCommunity,
  publicChannels,
  currentChannel,
  currentChannelMessagesCount,
  dailyGroupedCurrentChannelMessages,
  currentChannelMessagesMergedBySender,
};
