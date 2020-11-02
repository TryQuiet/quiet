import { createSelector } from 'reselect'
import channelsSelectors from './channel'

const store = s => s

export const ownedChannels = createSelector(store, state =>
  state.ownedChannels
)

const isOwner = createSelector(
  ownedChannels,
  channelsSelectors.channel,
  (a, channel) => !!a[channel.address]
)

export default {
  isOwner
}
