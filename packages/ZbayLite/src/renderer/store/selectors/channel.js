import { createSelector } from 'reselect'
import channelsSelector from './channels'
import identitySelectors from './identity'
import messagesQueueSelectors from './messagesQueue'
import operationsSelectors from './operations'
import messagesSelectors from './messages'
import zbayMessages from '../../zbay/messages'
import { operationTypes } from '../handlers/operations'

const store = s => s

export const channel = createSelector(store, state => state.get('channel'))

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

export const currentChannelMessages = createSelector(
  channel,
  store,
  (ch, store) => messagesSelectors.currentChannelMessages(ch.id)(store)
)

export const loader = createSelector(channel, meta => meta.loader)

export const messages = createSelector(
  identitySelectors.data,
  currentChannelMessages,
  pendingMessages,
  queuedMessages,
  (identity, receivedMessages, pendingMessages, queuedMessages) => {
    const identityAddress = identity.address
    const identityName = identity.name
    const displayableBroadcasted = receivedMessages.map(
      message => {
        return zbayMessages.receivedToDisplayableMessage({ message, identityAddress })
      }
    )

    const displayablePending = pendingMessages.map(
      operation => {
        return zbayMessages.operationToDisplayableMessage({ operation, identityAddress, identityName })
      }
    )

    const displayableQueued = queuedMessages.map(
      (queuedMessage, messageKey) => zbayMessages.queuedToDisplayableMessage({
        queuedMessage, messageKey, identityAddress, identityName
      })
    )
    return displayableBroadcasted.concat(
      displayablePending.values(),
      displayableQueued.values()
    ).sortBy(m => m.get('createdAt'))
  }
)

export const shareableUri = createSelector(channel, c => c.shareableUri)

export const inputLocked = createSelector(
  identitySelectors.balance('zec'),
  identitySelectors.lockedBalance('zec'),
  (available, locked) => {
    if (available.gt(0.0002)) {
      return INPUT_STATE.AVAILABLE
    } else {
      if (locked.gt(0.0002)) {
        return INPUT_STATE.LOCKED
      }
    }
    return INPUT_STATE.DISABLE
  }
)

export const INPUT_STATE = {
  DISABLE: 0,
  AVAILABLE: 1,
  LOCKED: 2
}

export const channelId = createSelector(channel, ch => ch.id)

export default {
  data,
  inputLocked,
  loader,
  channel,
  spentFilterValue,
  message,
  pendingMessages,
  shareableUri,
  channelId,
  messages
}
