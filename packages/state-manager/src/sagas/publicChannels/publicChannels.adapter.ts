import { createEntityAdapter } from '@reduxjs/toolkit'
import { CommunityChannels, PublicChannelStatus, PublicChannelStorage } from './publicChannels.types'
import { ChannelMessage } from '../..'

export const communityChannelsAdapter =
  createEntityAdapter<CommunityChannels>()

export const publicChannelsAdapter = createEntityAdapter<PublicChannelStorage>({
  selectId: (channel) => channel.address
})

export const publicChannelsStatusAdapter = createEntityAdapter<PublicChannelStatus>({
  selectId: (channel) => channel.address
})

export const channelMessagesAdapter = createEntityAdapter<ChannelMessage>()
