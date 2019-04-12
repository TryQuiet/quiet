import { createSelector } from 'reselect'
import channelsSelector from './channels'

const store = s => s

const channel = createSelector(store, state => state.get('channel'))

const data = createSelector(
  channelsSelector.data,
  channel,
  (channels, channel) => channels.find(ch => ch.get('id') === channel.id)
)

export const spentFilterValue = createSelector(channel, c => c.get('spentFilterValue', -1))

export const message = createSelector(channel, c => c.get('message'))

export const messagesMeta = createSelector(channel, c => c.messages)
export const messages = createSelector(messagesMeta, m => m.data)

export default {
  data,
  channel,
  spentFilterValue,
  message,
  messages
}
