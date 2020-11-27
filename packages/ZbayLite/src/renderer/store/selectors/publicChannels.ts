import { createSelector } from 'reselect'

import { Store } from '../reducers'

const publicChannels = (s: Store) => s.publicChannels

const publicChannelsByAddress = address =>
  createSelector(publicChannels, channels => channels[address])

export default {
  publicChannelsByAddress,
  publicChannels
}
