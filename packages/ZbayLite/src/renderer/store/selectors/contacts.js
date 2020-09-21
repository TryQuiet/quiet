import { createSelector } from 'reselect'
import Immutable from 'immutable'
import identitySelectors from './identity'
import directMssagesQueueSelectors from './directMessagesQueue'
import operationsSelectors from './operations'
import { operationTypes } from '../handlers/operations'
// import usersSelectors from './users'
import { mergeIntoOne, displayableMessageLimit } from './channel'
import { unknownUserId, messageType } from '../../../shared/static'
// import messagesSelectors from './messages'

export const Contact = Immutable.Record({
  lastSeen: null,
  key: '',
  username: '',
  address: '',
  messages: Immutable.Map(),
  newMessages: Immutable.List(),
  vaultMessages: Immutable.List(),
  offerId: null
})

const store = s => s

const contacts = createSelector(store, state => state.get('contacts'))
const contactsList = createSelector(
  contacts,
  identitySelectors.removedChannels,
  (contacts, removedChannels) => {
    if (removedChannels.size > 0) {
      return contacts
        .filter(
          c =>
            c.key.length === 66 &&
            c.offerId === null &&
            !removedChannels.includes(c.address)
        )
        .toList()
    }
    return contacts
      .filter(c => c.key.length === 66 && c.offerId === null)
      .toList()
  }
)

const unknownMessages = createSelector(contacts, (contacts) => {
  return contacts
    .filter(c => c.key === unknownUserId)
    .toList()
})

const offerList = createSelector(
  contacts,
  identitySelectors.removedChannels,
  (contacts, removedChannels) => {
    if (removedChannels.size > 0) {
      return contacts
        .filter(c => !!c.offerId && !removedChannels.includes(c.key))
        .toList()
    }
    return contacts.filter(c => !!c.offerId).toList()
  }
)
const channelsList = createSelector(
  contacts,
  identitySelectors.removedChannels,
  (contacts, removedChannels) => {
    if (removedChannels.size > 0) {
      return contacts
        .filter(
          c =>
            c.key.length === 78 &&
            c.offerId === null &&
            !removedChannels.includes(c.address)
        )
        .toList()
    }
    return contacts
      .filter(c => c.key.length === 78 && c.offerId === null)
      .toList()
  }
)

const directMessagesContact = address =>
  createSelector(contacts, c =>
    c.toList().find(el => el.get('address') === address)
  )

const contact = address =>
  createSelector(contacts, c => c.get(address, Contact()))

const messagesSorted = address =>
  createSelector(contact(address), c => {
    return c.messages
      .toList()
      .sort((msg1, msg2) => msg2.createdAt - msg1.createdAt)
  })
const messagesSortedDesc = address =>
  createSelector(contact(address), c => {
    return c.messages
      .toList()
      .sort((msg1, msg2) => msg1.createdAt - msg2.createdAt)
  })

const messagesLength = address =>
  createSelector(contact(address), c => {
    return c.messages.toList().size
  })
const messages = address =>
  createSelector(
    messagesSorted(address),
    displayableMessageLimit,
    (msgs, limit) => {
      return msgs.slice(0, limit)
    }
  )

const channelSettingsMessages = address =>
  createSelector(
    messagesSortedDesc(address),
    (msgs) => {
      return msgs.filter(msg => msg.get('type') === 6)
    }
  )

const allMessages = createSelector(contacts, c =>
  c.reduce((acc, t) => acc.merge(t.messages), Immutable.Map())
)
const getAdvertById = txid =>
  createSelector(allMessages, msgs => msgs.get(txid))
const lastSeen = address => createSelector(contact(address), c => c.lastSeen)
const username = address => createSelector(contact(address), c => c.username)
const vaultMessages = address =>
  createSelector(contact(address), c => c.vaultMessages)
const newMessages = address =>
  createSelector(contact(address), c => c.newMessages)

export const queuedMessages = address =>
  createSelector(
    directMssagesQueueSelectors.queue,
    queue =>
      queue.filter(
        m => m.recipientAddress === address && m.message.get('type') < 10
      ) //  separate offer messages and direct messages
  )

export const pendingMessages = address =>
  createSelector(operationsSelectors.operations, operations =>
    operations.filter(
      o =>
        o.type === operationTypes.pendingDirectMessage &&
        o.meta.recipientAddress === address &&
        o.meta.message.get('type') < 10 //  separate offer messages and direct messages
    )
  )

const channelOwner = channelId => createSelector(
  channelSettingsMessages(channelId),
  msgs => {
    let channelOwner = null
    channelOwner = msgs.get(0) ? msgs.get(0).get('publicKey') : null
    for (const msg of msgs) {
      if (channelOwner === msg.get('publicKey')) {
        channelOwner = msg.getIn(['message', 'owner'])
      }
    }
    return channelOwner
  }
)

export const directMessages = (address, signerPubKey) =>
  createSelector(
    messages(address),
    channelOwner(address),
    (messages, channelOwner) => {
      let channelModerators = Immutable.List()
      let messsagesToRemove = Immutable.List()
      let blockedUsers = Immutable.List()
      let visibleMessages = Immutable.List()
      for (const msg of messages.reverse()) {
        switch (msg.get('type')) {
          case messageType.AD:
            if (!blockedUsers.includes(msg.get('publicKey'))) {
              visibleMessages = visibleMessages.push(msg)
            }
            break
          case messageType.BASIC:
            if (!blockedUsers.includes(msg.get('publicKey'))) {
              visibleMessages = visibleMessages.push(msg)
            }
            break
          case messageType.TRANSFER:
            if (!blockedUsers.includes(msg.get('publicKey'))) {
              visibleMessages = visibleMessages.push(msg)
            }
            break
          case messageType.MODERATION:
            const senderPk = msg.get('publicKey')
            const moderationType = msg.getIn(['message', 'moderationType'])
            const moderationTarget = msg.getIn(['message', 'moderationTarget'])
            if (channelOwner === senderPk && moderationType === 'ADD_MOD') {
              channelModerators = channelModerators.push(moderationTarget)
            } else if (channelOwner === senderPk && moderationType === 'REMOVE_MOD') {
              const indexToRemove = channelModerators.findIndex(el => el === moderationTarget)
              if (indexToRemove !== -1) {
                channelModerators = channelModerators.remove(indexToRemove)
              }
            } else if ((channelOwner === senderPk || channelModerators.includes(senderPk)) && moderationType === 'BLOCK_USER') {
              blockedUsers = blockedUsers.push(moderationTarget)
              visibleMessages = visibleMessages.filter(msg => !blockedUsers.includes(msg.publicKey))
            } else if ((channelOwner === senderPk || channelModerators.includes(senderPk)) && moderationType === 'UNBLOCK_USER') {
              const indexToRemove = blockedUsers.findIndex(el => el === moderationTarget)
              if (indexToRemove !== -1) {
                blockedUsers = blockedUsers.remove(indexToRemove)
              }
            } else if ((channelOwner === senderPk || channelModerators.includes(senderPk)) && moderationType === 'REMOVE_MESSAGE') {
              const indexToRemove = visibleMessages.findIndex(el => el.get('id') === moderationTarget)
              if (indexToRemove !== -1) {
                visibleMessages = visibleMessages.remove(indexToRemove)
              }
            } else {}
            break
        }
      }
      return Immutable.fromJS({
        channelModerators,
        messsagesToRemove,
        blockedUsers,
        visibleMessages: mergeIntoOne(visibleMessages.reverse())
      })
    }
  )

export default {
  contacts,
  directMessagesContact,
  queuedMessages,
  pendingMessages,
  contact,
  messages,
  directMessages,
  lastSeen,
  vaultMessages,
  username,
  newMessages,
  contactsList,
  channelsList,
  offerList,
  getAdvertById,
  allMessages,
  messagesLength,
  messagesSorted,
  unknownMessages
}
