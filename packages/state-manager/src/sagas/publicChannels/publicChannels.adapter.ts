import { ChannelMessage, PublicChannelStatus, PublicChannelStorage, PublicChannelSubscription } from '@quiet/types'
import { createEntityAdapter } from '@reduxjs/toolkit'

export const publicChannelsAdapter = createEntityAdapter<PublicChannelStorage>({
  selectId: (channel) => channel.id
})

export const publicChannelsStatusAdapter = createEntityAdapter<PublicChannelStatus>({
  selectId: (channel) => channel.id
})

export const publicChannelsSubscriptionsAdapter = createEntityAdapter<PublicChannelSubscription>({
  selectId: (channel) => channel.id
})

export const channelMessagesAdapter = createEntityAdapter<ChannelMessage>()
