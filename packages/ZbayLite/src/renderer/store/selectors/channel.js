import { createSelector } from 'reselect'
import channelsSelector from './channels'
import identitySelectors from './identity'
import messagesQueueSelectors from './messagesQueue'
import operationsSelectors from './operations'
import { operationTypes } from '../handlers/operations'

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
  operationsSelectors.operations,
  channel,
  (operations, channel) => operations.filter(
    o => o.type === operationTypes.pendingMessage && o.meta.channelId === channel.id
  )
)

export const queuedMessages = createSelector(
  messagesQueueSelectors.queue,
  channel,
  (queue, channel) => queue.filter(m => m.channelId === channel.id)
)

export const messagesMeta = createSelector(channel, c => c.messages)

const _isOwner = (address, message) => message.getIn(['sender', 'replyTo']) === address

export const loader = createSelector(messagesMeta, meta => meta.loader)

export const messages = createSelector(
  identitySelectors.data,
  messagesMeta,
  pendingMessages,
  queuedMessages,
  (identity, meta, pendingMessages, queuedMessages) => {
    const displayableBroadcasted = meta.data.map(
      m => m.set('fromYou', _isOwner(identity.address, m))
    )
    const displayablePending = pendingMessages.map(
      m => m.meta.message
        .set('error', m.get('error'))
        .set('status', m.get('status'))
        .set('id', m.get('opId'))
        .set('fromYou', _isOwner(identity.address, m.meta.message))
    )

    const displayableQueued = queuedMessages.map(
      (m, key) => m.message.set('fromYou', _isOwner(identity.address, m.message))
        .set('id', key)
        .set('status', 'pending')
    )
    return displayableBroadcasted.concat(
      displayablePending.values(),
      displayableQueued.values()
    ).sortBy(m => m.get('createdAt'))
  }
)

export const shareableUri = createSelector(channel, c => c.shareableUri)

export default {
  data,
  loader,
  channel,
  spentFilterValue,
  message,
  pendingMessages,
  shareableUri,
  messages
}
