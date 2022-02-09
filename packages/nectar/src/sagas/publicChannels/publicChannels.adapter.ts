import { createEntityAdapter } from '@reduxjs/toolkit'
import { CommunityChannels, PublicChannel } from './publicChannels.types'
import { ChannelMessage } from '../..'

export const communityChannelsAdapter =
  createEntityAdapter<CommunityChannels>()

export const publicChannelsAdapter = createEntityAdapter<PublicChannel>({
  selectId: (channel) => channel.address
})

export const channelMessagesAdapter = createEntityAdapter<ChannelMessage>()
