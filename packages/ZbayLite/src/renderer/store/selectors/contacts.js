import { createSelector } from 'reselect'
import Immutable from 'immutable'

export const Contact = Immutable.Record({
  lastSeen: null,
  username: '',
  address: '',
  messages: Immutable.List(),
  newMessages: Immutable.List()
})

const store = s => s

const contacts = createSelector(store, state => state.get('contacts'))
const contact = address => createSelector(contacts, c => c.get(address, Contact()))
const messages = address => createSelector(contact(address), c => c.messages)
const lastSeen = address => createSelector(contact(address), c => c.lastSeen)

export default {
  contacts,
  contact,
  messages,
  lastSeen
}
