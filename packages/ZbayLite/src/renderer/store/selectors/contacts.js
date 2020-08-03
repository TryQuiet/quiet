import { createSelector } from 'reselect'
import Immutable from 'immutable'
import identitySelectors from './identity'
import directMssagesQueueSelectors from './directMessagesQueue'
import zbayMessages from '../../zbay/messages'
import operationsSelectors from './operations'
import { operationTypes } from '../handlers/operations'
import usersSelectors from './users'
import { mergeIntoOne } from './channel'

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
const contactsList = createSelector(contacts, contacts =>
  contacts.filter(c => c.key.length === 66 && c.offerId === null).toList()
)
const offerList = createSelector(contacts, contacts =>
  contacts.filter(c => !!c.offerId).toList()
)
const channelsList = createSelector(contacts, contacts =>
  contacts.filter(c => c.key.length === 78 && c.offerId === null).toList()
)
const contact = address =>
  createSelector(contacts, c => c.get(address, Contact()))
const messages = address =>
  createSelector(contact(address), c => c.messages.toList())
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

export const directMessages = (address, signerPubKey) =>
  createSelector(
    identitySelectors.data,
    usersSelectors.registeredUser(signerPubKey),
    messages(address),
    vaultMessages(address),
    (identity, registeredUser, messages, vaultMessages) => {
      const userData = registeredUser ? registeredUser.toJS() : null
      const identityAddress = identity.address
      const identityName = userData ? userData.nickname : identity.name

      const fetchedMessagesToDisplay = messages.map(msg =>
        zbayMessages.receivedToDisplayableMessage({
          message: msg,
          identityAddress,
          receiver: { replyTo: identityAddress, username: identityName }
        })
      )

      const concatedMessages = fetchedMessagesToDisplay
        .concat(vaultMessages.values())
        .sortBy(m => m.get('createdAt'))
      const merged = mergeIntoOne(concatedMessages)
      return merged
    }
  )

export default {
  contacts,
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
  allMessages
}
