import { createSelector } from 'reselect'
import { StoreKeys } from '../store.keys'
import {
  publicChannelsAdapter,
  communityChannelsAdapter,
  channelMessagesAdapter
} from './publicChannels.adapter'
import { CreatedSelectors, StoreState } from '../store.types'
import { certificatesMapping } from '../users/users.selectors'
import { currentCommunityId } from '../communities/communities.selectors'
import { MessageType } from '../messages/messages.types'
import { formatMessageDisplayDay } from '../../utils/functions/dates/formatMessageDisplayDate'
import { messagesVerificationStatus } from '../messages/messages.selectors'
import { CommunityChannels, DisplayableMessage, MessagesDailyGroups } from './publicChannels.types'
import { unreadMessagesAdapter } from './markUnreadMessages/unreadMessages.adapter'
import { displayableMessage } from '../../utils/functions/dates/formatDisplayableMessage'

const publicChannelSlice: CreatedSelectors[StoreKeys.PublicChannels] = (state: StoreState) =>
  state[StoreKeys.PublicChannels]

export const selectEntities = createSelector(publicChannelSlice, reducerState =>
  communityChannelsAdapter.getSelectors().selectEntities(reducerState.channels)
)

export const publicChannelsByCommunity = (id: string) =>
  createSelector(selectEntities, publicChannels => {
    const community = publicChannels[id]
    return publicChannelsAdapter.getSelectors().selectAll(community.channels)
  })

export const currentCommunityChannelsState = createSelector(
  selectEntities,
  currentCommunityId,
  (publicChannels, currentCommunity) => {
    const empty: CommunityChannels = {
      id: '',
      currentChannel: '',
      channelLoadingSlice: 0,
      channels: publicChannelsAdapter.getInitialState(),
      channelMessages: channelMessagesAdapter.getInitialState(),
      unreadMessages: unreadMessagesAdapter.getInitialState()
    }
    return publicChannels[currentCommunity] || empty
  }
)

export const publicChannels = createSelector(
  currentCommunityChannelsState,
  (state: CommunityChannels) => {
    return publicChannelsAdapter.getSelectors().selectAll(state.channels).sort((a, b) => {
      if (a.name === 'general') {
        return -1
      }
      if (b.name === 'general') {
        return 0
      }
      return a.name.localeCompare(b.name)
    })
  }
)

export const publicChannelsMessages = createSelector(
  currentCommunityChannelsState,
  (state: CommunityChannels) => {
    return channelMessagesAdapter.getSelectors().selectAll(state.channelMessages)
  }
)

export const missingChannelsMessages = createSelector(publicChannelsMessages, messages => {
  return messages.filter(message => message.type === MessageType.Empty).map(message => message.id)
})

export const currentChannel = createSelector(
  currentCommunityChannelsState,
  (state: CommunityChannels) => {
    return state.currentChannel
  }
)

export const channelLoadingSlice = createSelector(
  currentCommunityChannelsState,
  (state: CommunityChannels) => {
    return state.channelLoadingSlice
  }
)

export const currentChannelMessages = createSelector(
  publicChannelsMessages,
  currentChannel,
  (messages, channel) => {
    return messages.filter(message => message.channelAddress === channel)
  }
)

export const validCurrentChannelMessages = createSelector(
  currentChannelMessages,
  certificatesMapping,
  messagesVerificationStatus,
  (messages, certificates, verification) => {
    const filtered = messages.filter(message => message.pubKey in certificates)
    return filtered.filter(message => {
      const status = verification[message.signature]
      if (
        status &&
        status.publicKey === message.pubKey &&
        status.signature === message.signature &&
        status.verified
      ) {
        return message
      }
    })
  }
)

export const sortedCurrentChannelMessages = createSelector(
  validCurrentChannelMessages,
  messages => {
    return messages.sort((a, b) => b.createdAt - a.createdAt).reverse()
  }
)

export const slicedCurrentChannelMessages = createSelector(
  sortedCurrentChannelMessages,
  channelLoadingSlice,
  (messages, slice) => {
    return messages.slice(slice, messages.length)
  }
)

export const currentChannelMessagesCount = createSelector(
  slicedCurrentChannelMessages,
  messages => {
    return messages.length
  }
)

const displayableCurrentChannelMessages = createSelector(
  slicedCurrentChannelMessages,
  certificatesMapping,
  (messages, certificates) =>
    messages.map(message => {
      const user = certificates[message.pubKey]
      return displayableMessage(message, user.username)
    })
)

export const dailyGroupedCurrentChannelMessages = createSelector(
  displayableCurrentChannelMessages,
  messages => {
    const result: { [date: string]: DisplayableMessage[] } = messages.reduce((groups, message) => {
      const date = formatMessageDisplayDay(message.date)

      if (!groups[date]) {
        groups[date] = []
      }

      groups[date].push(message)
      return groups
    }, {})

    return result
  }
)

export const currentChannelMessagesMergedBySender = createSelector(
  dailyGroupedCurrentChannelMessages,
  groups => {
    const result: MessagesDailyGroups = {}
    for (const day in groups) {
      result[day] = groups[day].reduce((merged, message) => {
        // Get last item from collected array for comparison
        const last = merged.length && merged[merged.length - 1][0]

        if (last.nickname === message.nickname && last.createdAt - message.createdAt < 300) {
          merged[merged.length - 1].push(message)
        } else {
          merged.push([message])
        }

        return merged
      }, [])
    }

    return result
  }
)

export const unreadMessages = createSelector(
  currentCommunityChannelsState,
  (state: CommunityChannels) => {
    return unreadMessagesAdapter.getSelectors().selectAll(state.unreadMessages)
  }
)

export const unreadChannels = createSelector(unreadMessages, messages => {
  return messages.map(message => message.channelAddress)
})

export const publicChannelsSelectors = {
  publicChannelsByCommunity,
  publicChannels,
  currentChannel,
  currentChannelMessagesCount,
  dailyGroupedCurrentChannelMessages,
  currentChannelMessagesMergedBySender,
  unreadMessages,
  unreadChannels
}
