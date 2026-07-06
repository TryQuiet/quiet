import { createSelector } from 'reselect'
import { StoreKeys } from '../store.keys'
import {
  publicChannelsAdapter,
  channelMessagesAdapter,
  publicChannelsStatusAdapter,
  publicChannelsSubscriptionsAdapter,
} from './publicChannels.adapter'
import { type CreatedSelectors, type StoreState } from '../store.types'
import { userProfiles } from '../users/userProfile/userProfile.selectors'
import { formatMessageDisplayDate } from '../../utils/functions/dates/formatMessageDisplayDate'
import { displayableMessage } from '../../utils/functions/dates/formatDisplayableMessage'
import { isDefined } from '@quiet/common'
import {
  type ChannelMessage,
  type DisplayableMessage,
  MessageType,
  type MessagesDailyGroups,
  type MessagesGroupsType,
  type PublicChannel,
  type PublicChannelSubscription,
  type PublicChannelStatus,
  type PublicChannelStatusWithName,
  INITIAL_CURRENT_CHANNEL_ID,
  type UserProfile,
} from '@quiet/types'
import { createLogger } from '../../utils/logger'
import { currentCommunity } from '../communities/communities.selectors'

const logger = createLogger('publicChannelsSelector')

const selectState: CreatedSelectors[StoreKeys.PublicChannels] = (state: StoreState) => state[StoreKeys.PublicChannels]

export const selectChannels = createSelector(selectState, state => {
  if (!state) return []
  return publicChannelsAdapter.getSelectors().selectAll(state.channels)
})

const selectChannelsSubscriptions = createSelector(selectState, state => {
  if (!state) {
    logger.info('state is undefined')
    return []
  }
  return publicChannelsSubscriptionsAdapter.getSelectors().selectAll(state.channelsSubscriptions)
})

const pendingGeneralChannelRecreation = createSelector(selectState, state => {
  return state.pendingGeneralChannelRecreation
})

export const subscribedChannels = createSelector(selectChannelsSubscriptions, subscriptions => {
  return subscriptions.filter(subscription => subscription.subscribed).map(subscription => subscription.id)
})

const hasSubscribedChannel = (subscriptions: PublicChannelSubscription[], channelId: string | undefined): boolean => {
  if (!channelId) return false
  return subscriptions.some(subscription => subscription.id === channelId && subscription.subscribed)
}

export const isChannelSubscribed = (channelId: string | undefined) =>
  createSelector(selectChannelsSubscriptions, subscriptions => {
    return hasSubscribedChannel(subscriptions, channelId)
  })

// Serves for testing purposes only
export const selectGeneralChannel = createSelector(selectChannels, currentCommunity, (channels, currentCommunity) => {
  if (currentCommunity == null || currentCommunity.teamId == null) {
    logger.error('Community not initialized, skipping general channel')
    return
  }
  const draft = channels.find(item => item.name === 'general')
  if (!draft) {
    logger.error('No general channel')
    return
  }
  const channel: PublicChannel = {
    name: draft.name,
    description: draft.description,
    owner: draft.owner,
    timestamp: draft.timestamp,
    id: draft.id,
    public: draft.public,
    teamId: currentCommunity.teamId,
  }
  return channel
})

export const publicChannels = createSelector(selectChannels, selectChannelsSelector => {
  const channels = Array.from(selectChannelsSelector)
  const sorted = channels.sort((a, b) => {
    if (a.name === 'general') {
      return -1
    }
    if (b.name === 'general') {
      return 0
    }
    return a.name.localeCompare(b.name)
  })

  return sorted
})

export const sortedChannels = createSelector(publicChannels, channels => {
  const sorted = channels.sort((a, b) => {
    if (a.name === 'general') {
      return -1
    }
    if (b.name === 'general') {
      return 0
    }
    return a.name.localeCompare(b.name)
  })

  return sorted
})

export const generalChannel = createSelector(publicChannels, publicChannelsSelector => {
  return publicChannelsSelector.find(channel => channel.name === 'general')
})

export const currentChannelId = createSelector(selectState, generalChannel, (state, general) => {
  if (!state) {
    return undefined
  }
  if (state.currentChannelId === INITIAL_CURRENT_CHANNEL_ID) {
    if (general) {
      return general.id
    } else {
      return undefined
    }
  } else {
    return state.currentChannelId
  }
})

export const currentChannelSubscribed = createSelector(
  currentChannelId,
  selectChannelsSubscriptions,
  (id, subscriptions) => {
    return hasSubscribedChannel(subscriptions, id)
  }
)

export const recentChannels = createSelector(
  publicChannels,
  generalChannel,
  (publicChannelsSelector, generalChannelSelector) => {
    const recentChannels = publicChannelsSelector.sort((a, b) => b.timestamp - a.timestamp).slice(0, 3)
    return recentChannels.length >= 3 ? recentChannels : [generalChannelSelector]
  }
)

export const getChannelById = (channelId: string) =>
  createSelector(publicChannels, channels => {
    const channel = channels.find(channel => channel.id === channelId)
    if (!channel) {
      logger.warn('Channel not found', channelId)
    }
    return channel
  })

export const dynamicSearchedChannels = (channelInput: string) =>
  createSelector(publicChannels, recentChannels, (publicChannelsSelector, recentChannelsSelector) => {
    const filteredList = publicChannelsSelector.filter(channel => channel.name.includes(channelInput))

    const isFilteredList = filteredList.length > 0 ? filteredList : recentChannelsSelector

    const channelList = channelInput.length === 0 ? recentChannelsSelector : isFilteredList

    return channelList.filter(isDefined)
  })

// Is being used in tests
export const currentChannel = createSelector(currentChannelId, selectChannels, (id, channels) => {
  if (!id) return undefined
  return channels.find(channel => channel.id === id)
})

export const currentChannelName = createSelector(currentChannel, channel => {
  if (!channel) return ''
  return channel.name
})

export const currentChannelMessages = createSelector(currentChannel, channel => {
  if (!channel) return []
  return channelMessagesAdapter.getSelectors().selectAll(channel.messages)
})

export const sortedCurrentChannelMessages = createSelector(currentChannelMessages, messages => {
  return messages.sort((a, b) => b.createdAt - a.createdAt).reverse()
})

export const currentChannelLastDisplayedMessage = createSelector(sortedCurrentChannelMessages, messages => {
  return messages[0]
})

export const newestCurrentChannelMessage = createSelector(sortedCurrentChannelMessages, messages => {
  return messages[messages.length - 1]
})

export const displayableCurrentChannelMessages = createSelector(
  sortedCurrentChannelMessages,
  userProfiles,
  (messages, users: Record<string, UserProfile>) => {
    return messages.reduce((result: DisplayableMessage[], message: ChannelMessage) => {
      const user = users[message.userId!]
      if (user) {
        // @ts-ignore
        result.push(displayableMessage(message, users[message.userId]))
      } else {
        logger.warn('User Profile not found. Cannot display:', message.id, message.userId)
      }
      return result
    }, [])
  }
)

export const currentChannelMessagesCount = createSelector(displayableCurrentChannelMessages, messages => {
  return messages.length
})

/**
 * Channel display messages grouped by day
 */
export const dailyGroupedCurrentChannelMessages = createSelector(displayableCurrentChannelMessages, messages => {
  const result: MessagesGroupsType = messages.reduce((groups: MessagesGroupsType, message: DisplayableMessage) => {
    const date = formatMessageDisplayDate(message.createdAt)

    if (!groups[date]) {
      groups[date] = []
    }

    groups[date].push(message)
    return groups
  }, {})

  return result
})

/**
 * Channel messages grouped by day and then additionally by sender (if
 * there are successive messages by the same sender)
 */
export const currentChannelMessagesMergedBySender = createSelector(
  dailyGroupedCurrentChannelMessages,
  (groups: MessagesGroupsType) => {
    const result: MessagesDailyGroups = {}
    for (const day in groups) {
      result[day] = groups[day].reduce((merged: DisplayableMessage[][], message: DisplayableMessage) => {
        if (!merged.length) {
          merged.push([message])
          return merged
        }

        // Get last item from collected array for comparison
        const index = merged.length && merged.length - 1
        const last = merged[index][0]

        if (
          last?.userId === message?.userId &&
          message.createdAt - last.createdAt < 300 &&
          message.type !== MessageType.Info &&
          last.type !== MessageType.Info
        ) {
          merged[index].push(message)
        } else {
          merged.push([message])
        }

        return merged
      }, [])
    }

    return result
  }
)

export const channelsStatus = createSelector(selectState, state => {
  if (!state?.channelsStatus) return {}
  return publicChannelsStatusAdapter.getSelectors().selectEntities(state.channelsStatus)
})

export const channelsStatusSorted = createSelector(selectState, selectChannels, (state, channels) => {
  if (!state?.channelsStatus) return []
  const channelNamesById = new Map(channels.map(channel => [channel.id, channel.name]))
  const statuses = publicChannelsStatusAdapter.getSelectors().selectAll(state.channelsStatus)

  return statuses
    .map((status): PublicChannelStatusWithName | undefined => {
      const name = channelNamesById.get(status.id)
      if (name == null) {
        return undefined
      }
      return {
        ...status,
        name,
      }
    })
    .filter(isDefined)
    .sort((a, b) => {
      const aCreatedAt = a.newestMessage?.createdAt
      const bCreatedAt = b.newestMessage?.createdAt
      if (!aCreatedAt && !bCreatedAt) return 0
      if (!aCreatedAt) return -1
      if (!bCreatedAt) return 1
      return aCreatedAt - bCreatedAt
    })
    .reverse()
})

export const unreadChannels = createSelector(channelsStatus, status => {
  return Object.values(status)
    .filter(isDefined)
    .reduce((result: string[], channel: PublicChannelStatus) => {
      if (channel.unread) {
        result.push(channel.id)
      }
      return result
    }, [])
})

export const areMessagesLoaded = createSelector(currentChannelMessagesMergedBySender, currentChannelMessages => {
  const messageCount = Object.values(currentChannelMessages).length
  return messageCount > 0
})

export const areChannelsLoaded = createSelector(publicChannels, channels => {
  const channelCount = channels.length
  return channelCount > 0
})

// TODO: update when we have assignable roles and tie channel operations to specific roles
export const canCreateChannel = createSelector(selectState, () => {
  return true
})

// TODO: update when we have assignable roles and tie channel operations to specific roles
export const canCreatePrivateChannel = createSelector(selectState, () => {
  return true
})

export const publicChannelsSelectors = {
  publicChannels,
  subscribedChannels,
  isChannelSubscribed,
  currentChannelSubscribed,
  currentChannelId,
  currentChannelName,
  currentChannel,
  currentChannelMessages,
  sortedCurrentChannelMessages,
  displayableCurrentChannelMessages,
  newestCurrentChannelMessage,
  currentChannelMessagesCount,
  currentChannelMessagesMergedBySender,
  currentChannelLastDisplayedMessage,
  unreadChannels,
  channelsStatus,
  channelsStatusSorted,
  dynamicSearchedChannels,
  sortedChannels,
  pendingGeneralChannelRecreation,
  generalChannel,
  getChannelById,
  areMessagesLoaded,
  areChannelsLoaded,
  canCreateChannel,
  canCreatePrivateChannel,
}
