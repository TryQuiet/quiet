import { type ChannelMessage, type ChannelStatus, type ChannelStorage, type ChannelSubscription } from '@quiet/types'
import { createEntityAdapter } from '@reduxjs/toolkit'

export const publicChannelsAdapter = createEntityAdapter<ChannelStorage>({
  selectId: channel => channel.id,
})

export const publicChannelsStatusAdapter = createEntityAdapter<ChannelStatus>({
  selectId: channel => channel.id,
})

export const publicChannelsSubscriptionsAdapter = createEntityAdapter<ChannelSubscription>({
  selectId: channel => channel.id,
})

export const channelMessagesAdapter = createEntityAdapter<ChannelMessage>()
