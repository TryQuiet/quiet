import { createSelector } from 'reselect'
import channelsSelector from './channels'
import identitySelectors from './identity'
import pendingMessagesSelectors from './pendingMessages'

const store = s => s

const channel = createSelector(store, state => state.get('channel'))

const data = createSelector(
  channelsSelector.data,
  channel,
  (channels, channel) => channels.find(ch => ch.get('id') === channel.id)
)

export const spentFilterValue = createSelector(channel, c => c.get('spentFilterValue', -1))

export const message = createSelector(channel, c => c.get('message'))

export const pendingMessages = createSelector(
  pendingMessagesSelectors.pendingMessages,
  channel,
  (pendingMessages, channel) => pendingMessages.filter(m => m.channelId === channel.id)
)

export const messagesMeta = createSelector(channel, c => c.messages)

const _isOwner = (address, message) => message.getIn(['sender', 'replyTo']) === address

export const messages = createSelector(
  identitySelectors.data,
  messagesMeta,
  pendingMessages,
  (identity, meta, pendingMessages) => {
    const displayableBroadcasted = meta.data.map(
      m => m.set('fromYou', _isOwner(identity.address, m))
    )
    const displayablePending = pendingMessages.map(
      m => m.get('message')
        .set('error', m.get('error'))
        .set('status', m.get('status'))
        .set('id', m.get('opId'))
        .set('fromYou', _isOwner(identity.address, m.get('message')))
    )
    return displayableBroadcasted.concat(displayablePending.values())
      .sortBy(m => m.get('createdAt'))
  })

export default {
  data,
  channel,
  spentFilterValue,
  message,
  pendingMessages,
  messages
}
