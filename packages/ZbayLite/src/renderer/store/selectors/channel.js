import { createSelector } from 'reselect'

const store = s => s

const channel = createSelector(store, state => state.get('channel'))

export const spentFilterValue = createSelector(channel, c => c.get('spentFilterValue', -1))
export const message = createSelector(channel, c => c.get('message'))
export const messages = createSelector(channel, c => c.get('messages'))

export default {
  channel,
  spentFilterValue,
  message,
  messages
}
