import { createSelector } from 'reselect'

const store = s => s

export const mentions = createSelector(store, state => state.get('mentions'))

export const mentionForChannel = channelId =>
  createSelector(mentions, state => state.get(channelId) || [])

export default {
  mentions,
  mentionForChannel
}
