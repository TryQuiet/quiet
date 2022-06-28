import { createEntityAdapter } from '@reduxjs/toolkit'
import { PublicChannelStatus, PublicChannelStorage, PublicChannelSubscription } from './publicChannels.types'
import { ChannelMessage } from '../..'

export const publicChannelsAdapter = createEntityAdapter<PublicChannelStorage>({
  selectId: (channel) => channel.address
})

export const publicChannelsStatusAdapter = createEntityAdapter<PublicChannelStatus>({
  selectId: (channel) => channel.address
})

export const publicChannelsSubscriptionsAdapter = createEntityAdapter<PublicChannelSubscription>({
  selectId: (channel) => channel.address
})

export const channelMessagesAdapter = createEntityAdapter<ChannelMessage>()
