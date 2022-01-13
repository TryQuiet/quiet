import { createEntityAdapter } from '@reduxjs/toolkit'
import { PublicChannel } from './publicChannels.types'
import { CommunityChannels } from './publicChannels.slice'
import { ChannelMessage } from '../..'

export const communityChannelsAdapter =
  createEntityAdapter<CommunityChannels>()

export const publicChannelsAdapter = createEntityAdapter<PublicChannel>({
  selectId: (channel) => channel.address
})

export const channelMessagesAdapter = createEntityAdapter<ChannelMessage>()
