import { createSelector } from 'reselect'
import channelsSelectors from './channel'

import { OwnedChannelsStore } from '../handlers/ownedChannels'

const ownedChannels = (s): OwnedChannelsStore => s.ownedChannels as OwnedChannelsStore

const isOwner = createSelector(
  ownedChannels,
  channelsSelectors.channel,
  (a, channel) => !!a[channel.address]
)

export default {
  isOwner
}
