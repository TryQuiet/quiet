import { createSelector } from 'reselect'
import channelsSelectors from './channel'

import { Store } from '../reducers'

const ownedChannels = (s: Store) => s.ownedChannels

const isOwner = createSelector(
  ownedChannels,
  channelsSelectors.channel,
  (a, channel) => !!a[channel.address]
)

export default {
  isOwner
}
