import { ChannelMessage, PublicChannelStatus, PublicChannelStorage, PublicChannelSubscription } from '@quiet/types'
import { createEntityAdapter } from '@reduxjs/toolkit'

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
