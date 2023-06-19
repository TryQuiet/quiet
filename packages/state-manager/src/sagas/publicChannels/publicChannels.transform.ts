import { type ChannelMessage, type PublicChannelStatus, type PublicChannelStorage } from '@quiet/types'
import { type Dictionary, type EntityState } from '@reduxjs/toolkit'
import { createTransform } from 'redux-persist'
import { StoreKeys } from '../store.keys'
import { publicChannelsAdapter, publicChannelsSubscriptionsAdapter } from './publicChannels.adapter'
import { type PublicChannelsState } from './publicChannels.slice'

export const PublicChannelsTransform = createTransform(
  (inboundState: PublicChannelsState, _key: any) => {
    return { ...inboundState }
  },
  (outboundState: PublicChannelsState, _key: any) => {
    const generalChannelId = getGeneralChannelId(outboundState)

    const transformedOutboundState = { ...outboundState } as any
    if (transformedOutboundState.currentChannelAddress) {
      delete transformedOutboundState.currentChannelAddress
    }

    outboundState.channels.entities = transformChannelsEntities(outboundState.channels.entities)

    outboundState.channelsStatus.entities = transformChannelStatusEntities(outboundState.channelsStatus.entities)

    return {
      ...transformedOutboundState,
      currentChannelId: generalChannelId,
      channels: outboundState.channels,
      channelsStatus: outboundState.channelsStatus,
      channelsSubscriptions: publicChannelsSubscriptionsAdapter.getInitialState(),
    }
  },
  { whitelist: [StoreKeys.PublicChannels] }
)

const getGeneralChannelId = (state: PublicChannelsState) => {
  const selectors = publicChannelsAdapter.getSelectors()
  const publicChannelStorage = selectors.selectAll(state.channels)
  const generalChannel = publicChannelStorage.find(channel => channel.name === 'general')
  const generalChannelId = generalChannel?.id || 'general'

  return generalChannelId
}

const transformChannelsEntities = (channelsEntities: Dictionary<PublicChannelStorage>) => {
  const messagesRefactor = (messages: EntityState<ChannelMessage>) => {
    const transformedMessagesEntities = messages.entities
    for (const [key, _message] of Object.entries(transformedMessagesEntities)) {
      const message = { ..._message } as any
      if (message.channelAddress) {
        const transformedMessage = {
          ...message,
          channelId: message.channelAddress,
        }
        delete transformedMessage.channelAddress

        transformedMessagesEntities[key] = transformedMessage
      }
    }

    return transformedMessagesEntities
  }

  for (const [key, _channel] of Object.entries(channelsEntities)) {
    const channel = { ..._channel } as any
    if (channel.address) {
      const messages = { ...channel.messages, entities: messagesRefactor(channel.messages) }
      const transformedChannel = {
        ...channel,
        messages,
        id: channel.address,
      }
      delete transformedChannel.address

      channelsEntities[key] = transformedChannel
    }
  }
  return channelsEntities
}

const transformChannelStatusEntities = (channelsStatusEntities: Dictionary<PublicChannelStatus>) => {
  const transformedChannelsStatusEntities = { ...channelsStatusEntities }
  for (const [key, _channel] of Object.entries(transformedChannelsStatusEntities)) {
    const channel = { ..._channel } as any
    if (channel.address) {
      let transformedNewestMessage = { ...channel.newestMessage }
      if (transformedNewestMessage.channelAddress) {
        transformedNewestMessage = {
          channelId: channel.address,
          ...transformedNewestMessage,
        }
        delete transformedNewestMessage.channelAddress
      }
      const transformedChannel = {
        ...channel,
        id: channel.address,
        newestMessage: transformedNewestMessage,
      }
      delete transformedChannel.address

      transformedChannelsStatusEntities[key] = transformedChannel
    }
  }

  return transformedChannelsStatusEntities
}
