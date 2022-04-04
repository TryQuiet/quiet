import { createSelector } from 'reselect'
import { StoreKeys } from '../store.keys'
import {
  publicChannelsAdapter,
  communityChannelsAdapter,
  channelMessagesAdapter
} from './publicChannels.adapter'
import { CreatedSelectors, StoreState } from '../store.types'
import { certificatesMapping } from '../users/users.selectors'
import { currentCommunity } from '../communities/communities.selectors'
import { MessageType } from '../messages/messages.types'
import { formatMessageDisplayDay } from '../../utils/functions/dates/formatMessageDisplayDate'
import { messagesVerificationStatus } from '../messages/messages.selectors'
import {
  ChannelMessage,
  CommunityChannels,
  DisplayableMessage,
  MessagesDailyGroups,
  PublicChannel
} from './publicChannels.types'
import { unreadMessagesAdapter } from './markUnreadMessages/unreadMessages.adapter'
import { displayableMessage } from '../../utils/functions/dates/formatDisplayableMessage'

const publicChannelSlice: CreatedSelectors[StoreKeys.PublicChannels] = (state: StoreState) =>
  state[StoreKeys.PublicChannels]

const selectEntities = createSelector(publicChannelSlice, reducerState =>
  communityChannelsAdapter.getSelectors().selectEntities(reducerState.channels)
)

const selectState = createSelector(
  selectEntities,
  currentCommunity,
  (entities, community) => {
    return entities[community?.id]
  }
)

const selectChannels = createSelector(selectState, (state: CommunityChannels) => {
  if (!state) return []
  return publicChannelsAdapter.getSelectors().selectAll(state.channels)
})

const selectChannelsMessages = createSelector(selectState, (state: CommunityChannels) => {
  if (!state) return []
  return channelMessagesAdapter.getSelectors().selectAll(state.channelMessages)
})

export const publicChannels = createSelector(selectChannels, (channels: PublicChannel[]) => {
  return channels.sort((a, b) => {
    if (a.name === 'general') {
      return -1
    }
    if (b.name === 'general') {
      return 0
    }
    return a.name.localeCompare(b.name)
  })
})

export const currentChannel = createSelector(
  selectState,
  selectChannels,
  (state: CommunityChannels, channels: PublicChannel[]) => {
    if (!state) return undefined
    return channels.find(channel => channel.address === state.currentChannel)
  }
)

const currentChannelMessages = createSelector(
  selectChannelsMessages,
  currentChannel,
  (messages: ChannelMessage[], channel: PublicChannel) => {
    return messages.filter(message => message.channelAddress === channel.address)
  }
)

export const missingChannelsMessages = createSelector(
  selectChannelsMessages,
  (messages: ChannelMessage[]) => {
    return messages.filter(message => message.type === MessageType.Empty).map(message => message.id)
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
  currentChannel,
  (messages: ChannelMessage[], channel: PublicChannel) => {
    return messages.slice((channel?.messagesSlice || 0), messages.length)
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

        if (last.nickname === message.nickname && message.createdAt - last.createdAt < 300) {
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

export const unreadMessages = createSelector(selectState, (state: CommunityChannels) => {
  if (!state) return []
  return unreadMessagesAdapter.getSelectors().selectAll(state.unreadMessages)
})

export const unreadChannels = createSelector(unreadMessages, messages => {
  return messages.map(message => message.channelAddress)
})

export const publicChannelsSelectors = {
  publicChannels,
  currentChannel,
  currentChannelMessagesCount,
  dailyGroupedCurrentChannelMessages,
  currentChannelMessagesMergedBySender,
  unreadMessages,
  unreadChannels
}
