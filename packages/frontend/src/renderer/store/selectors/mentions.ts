import { createSelector } from 'reselect'

import { Store } from '../reducers'

const mentions = (s: Store) => s.mentions

export const mentionForChannel = channelId =>
  createSelector(mentions, state => state[channelId] || [])

export default {
  mentions,
  mentionForChannel
}
