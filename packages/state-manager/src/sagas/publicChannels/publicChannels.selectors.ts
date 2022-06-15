import { createSelector } from 'reselect'
import { StoreKeys } from '../store.keys'
import {
  publicChannelsAdapter,
  communityChannelsAdapter,
  channelMessagesAdapter,
  publicChannelsStatusAdapter
} from './publicChannels.adapter'
import { CreatedSelectors, StoreState } from '../store.types'
import { certificatesMapping } from '../users/users.selectors'
import { currentCommunity } from '../communities/communities.selectors'
import { formatMessageDisplayDay } from '../../utils/functions/dates/formatMessageDisplayDate'
import { displayableMessage } from '../../utils/functions/dates/formatDisplayableMessage'
import {
  DisplayableMessage,
  MessagesDailyGroups,
  PublicChannel,
  PublicChannelStatus
} from './publicChannels.types'
import { MessageType } from '../messages/messages.types'

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

export const selectChannels = createSelector(selectState, (state) => {
  if (!state) return []
  return publicChannelsAdapter.getSelectors().selectAll(state.channels)
})

// Serves for testing purposes only
export const selectGeneralChannel = createSelector(selectChannels, channels => {
  const draft = channels.find(item => item.address === 'general')
  const channel: PublicChannel = {
    name: draft.name,
    description: draft.description,
    owner: draft.owner,
    timestamp: draft.timestamp,
    address: draft.address
  }
  return channel
})

export const publicChannels = createSelector(selectChannels, (channels) => {
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

export const currentChannelAddress = createSelector(
  selectState,
  (state) => {
    if (!state) return undefined
    return state.currentChannelAddress
  }
)

// Is being used in tests
export const currentChannel = createSelector(
  currentChannelAddress,
  selectChannels,
  (address, channels) => {
    if (!address) return undefined
    return channels.find(channel => channel.address === address)
  }
)

export const currentChannelName = createSelector(
  currentChannel,
  (channel) => {
    if (!channel) return ''
    return channel.name
  }
)

const currentChannelMessages = createSelector(
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

export const unreadChannels = createSelector(
  channelsStatus,
  status => {
    return Object.values(status).reduce((result: string[], channel: PublicChannelStatus) => {
      if (channel.unread) {
        result.push(channel.address)
      }
      return result
    }, [])
  }
)

export const publicChannelsSelectors = {
  publicChannels,
  currentChannelAddress,
  currentChannelName,
  currentChannel,
  currentChannelMessages,
  sortedCurrentChannelMessages,
  displayableCurrentChannelMessages,
  currentChannelMessagesCount,
  currentChannelMessagesMergedBySender,
  currentChannelLastDisplayedMessage,
  unreadChannels
}
