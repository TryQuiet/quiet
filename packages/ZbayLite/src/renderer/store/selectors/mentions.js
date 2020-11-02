import { createSelector } from 'reselect'

const store = s => s

export const mentions = createSelector(store, state => state.mentions)

export const mentionForChannel = channelId =>
  createSelector(mentions, state => state[channelId] || [])

export default {
  mentions,
  mentionForChannel
}
