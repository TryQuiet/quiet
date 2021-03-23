import { createSelector } from 'reselect'

import { Store } from '../reducers'

const publicChannels = (s: Store) => s.publicChannels

const publicChannelsByAddress = address =>
  createSelector(publicChannels, channels => channels[address])

const publicChannelsByName = (name: string) =>
  createSelector(publicChannels, channels => channels[name])

export default {
  publicChannelsByAddress,
  publicChannelsByName,
  publicChannels
}
