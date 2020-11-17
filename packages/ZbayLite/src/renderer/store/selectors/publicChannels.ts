import { createSelector } from 'reselect'

import { PublicChannelsStore } from '../handlers/publicChannels'

const publicChannels = (s): PublicChannelsStore => s.publicChannels as PublicChannelsStore

const publicChannelsByAddress = address =>
  createSelector(publicChannels, channels => channels[address])

export default {
  publicChannelsByAddress,
  publicChannels
}
