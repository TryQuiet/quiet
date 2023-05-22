import { createSelector } from 'reselect'
import { StoreKeys } from '../store.keys'
import {
  publicChannelsAdapter,
  channelMessagesAdapter,
  publicChannelsStatusAdapter,
  publicChannelsSubscriptionsAdapter
} from './publicChannels.adapter'
import { CreatedSelectors, StoreState } from '../store.types'
import { certificatesMapping } from '../users/users.selectors'
import { formatMessageDisplayDay } from '../../utils/functions/dates/formatMessageDisplayDate'
import { displayableMessage } from '../../utils/functions/dates/formatDisplayableMessage'
import {
  DisplayableMessage,
  INITIAL_CURRENT_CHANNEL_ID,
  MessagesDailyGroups,
  PublicChannel,
  PublicChannelStatus
} from './publicChannels.types'
import { MessageType } from '../messages/messages.types'

const selectState: CreatedSelectors[StoreKeys.PublicChannels] = (state: StoreState) =>
  state[StoreKeys.PublicChannels]

export const selectChannels = createSelector(selectState, (state) => {
  if (!state) return []
  return publicChannelsAdapter.getSelectors().selectAll(state.channels)
})

const selectChannelsSubscriptions = createSelector(selectState, (state) => {
  if (!state) return []
  return publicChannelsSubscriptionsAdapter.getSelectors().selectAll(state.channelsSubscriptions)
})

const pendingGeneralChannelRecreation = createSelector(selectState, state => {
  return state.pendingGeneralChannelRecreation
})

export const subscribedChannels = createSelector(
  selectChannelsSubscriptions,
  (subscriptions) => {
    return subscriptions.map(subscription => {
      if (subscription.subscribed) return subscription.id
    })
  }
)

// Serves for testing purposes only
export const selectGeneralChannel = createSelector(selectChannels, channels => {
  const draft = channels.find(item => item.name === 'general')
  const channel: PublicChannel = {
    name: draft.name,
    description: draft.description,
    owner: draft.owner,
    timestamp: draft.timestamp,
    id: draft.id
  }
  return channel
})

export const publicChannels = createSelector(selectChannels, (selectChannelsSelector) => {
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

export const sortedChannels = createSelector(publicChannels, (channels) => {
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

export const currentChannelId_OLD = createSelector(
  selectState,
  (state) => {
    if (!state) return undefined
    return state.currentChannelId
  }
)

export const generalChannel = createSelector(publicChannels, publicChannelsSelector => {
  return publicChannelsSelector.find(channel => channel.name === 'general')
})

export const currentChannelId = createSelector(
  selectState,
  generalChannel,
  (state, general) => {
    // KACPER - test for it - IMPORTANT !!!!
    if (!state) {
      return undefined
    }
    if (state.currentChannelId === INITIAL_CURRENT_CHANNEL_ID) {
      if (general) {
        return general.id
      } else {
        return 'general'// case for tests when is no channel in store
      }
    } else {
      return state.currentChannelId
    }
  }
)

export const recentChannels = createSelector(
  publicChannels,
  generalChannel,
  (publicChannelsSelector, generalChannelSelector) => {
    const recentChannels = publicChannelsSelector
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 3)
    return recentChannels.length >= 3 ? recentChannels : [generalChannelSelector]
  }
)

export const dynamicSearchedChannels = (channelInput: string) =>
  createSelector(
    publicChannels,
    recentChannels,
    (publicChannelsSelector, recentChannelsSelector) => {
      const filteredList = publicChannelsSelector.filter(channel =>
        channel.name.includes(channelInput)
      )

      const isFilteredList = filteredList.length > 0 ? filteredList : recentChannelsSelector

      const channelList = channelInput.length === 0 ? recentChannelsSelector : isFilteredList

      return channelList
    }
  )

// Is being used in tests
export const currentChannel = createSelector(
  currentChannelId,
  selectChannels,
  (id, channels) => {
    if (!id) return undefined
    return channels.find(channel => channel.id === id)
  }
)

export const currentChannelName = createSelector(
  currentChannel,
  (channel) => {
    if (!channel) return ''
    return channel.name
  }
)

export const currentChannelMessages = createSelector(
  currentChannel,
  (channel) => {
    if (!channel) return []
    return channelMessagesAdapter.getSelectors().selectAll(channel.messages)
  }
)

export const sortedCurrentChannelMessages = createSelector(
  currentChannelMessages,
  messages => {
    return messages.sort((a, b) => b.createdAt - a.createdAt).reverse()
  }
)

export const currentChannelLastDisplayedMessage = createSelector(
  sortedCurrentChannelMessages,
  (messages) => {
    return messages[0]
  }
)

export const newestCurrentChannelMessage = createSelector(
  sortedCurrentChannelMessages,
  messages => {
    return messages[messages.length - 1]
  }
)

export const displayableCurrentChannelMessages = createSelector(
  sortedCurrentChannelMessages,
  certificatesMapping,
  (messages, certificates) => {
    return messages.reduce((result, message) => {
      const user = certificates[message.pubKey]
      if (user) {
        result.push(displayableMessage(message, user.username))
      }
      return result
    }, [])
  }
)

export const currentChannelMessagesCount = createSelector(
  displayableCurrentChannelMessages,
  (messages) => {
    return messages.length
  }
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

        if (last.nickname === message.nickname && message.createdAt - last.createdAt < 300 && message.type !== MessageType.Info && last.type !== MessageType.Info) {
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

export const channelsStatus = createSelector(
  selectState,
  state => {
    if (!state || !state.channelsStatus) return {}
    return publicChannelsStatusAdapter
      .getSelectors()
      .selectEntities(state.channelsStatus)
  }
)

export const channelsStatusSorted = createSelector(
  selectState,
  state => {
    if (!state || !state.channelsStatus) return []
    const statuses = publicChannelsStatusAdapter
      .getSelectors()
      .selectAll(state.channelsStatus)

    return statuses.sort((a, b) => a.newestMessage?.createdAt - b.newestMessage?.createdAt).reverse()
  }
)

export const unreadChannels = createSelector(
  channelsStatus,
  status => {
    return Object.values(status).reduce((result: string[], channel: PublicChannelStatus) => {
      if (channel.unread) {
        result.push(channel.id)
      }
      return result
    }, [])
  }
)

export const publicChannelsSelectors = {
  publicChannels,
  subscribedChannels,
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
  generalChannel
}
