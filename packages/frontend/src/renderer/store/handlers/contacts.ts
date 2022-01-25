import { produce, immerable } from 'immer'
import { DateTime } from 'luxon'
import { createAction, handleActions } from 'redux-actions'
import { remote } from 'electron'

import history from '../../../shared/history'
import { actionTypes } from '../../../shared/static'
import selectors from '../selectors/contacts'
import * as _ from 'lodash'

import { ActionsType, PayloadType } from './types'

export class Contact {
  lastSeen?: DateTime
  key: string = ''
  username: string = ''
  address: string = ''
  newMessages: string[] = []
  vaultMessages: any[] = []
  messages: any[] = []
  offerId?: string
  unread?: number
  connected?: boolean
  nickname?: string
  constructor(values?: Partial<Contact>) {
    Object.assign(this, values)
    this[immerable] = true
  }

  typingIndicator: boolean = false
}
export interface ISender {
  replyTo: string
  username: string
}

export interface ContactsStore {
  [key: string]: Contact
}

const initialState: ContactsStore = {}

const setMessages = createAction<{
  messages:
  | {
    [key: string]: any
  }
  | any[]
  contactAddress: string
  username: string
  key: string
}>(actionTypes.SET_DIRECT_MESSAGES)
const setChannelMessages = createAction<{
  messages:
  | {
    [key: string]: any
  }
  | any[]
  contactAddress: string
  username: string
  key: string
}>(actionTypes.SET_CHANNEL_MESSAGES)
const addContact = createAction<{
  offerId?: string
  contactAddress: string
  username: string
  key: string
}>(actionTypes.ADD_CONTACT)
const addDirectContact = createAction<{
  offerId?: string
  contactAddress: string
  username: string
  key: string
}>(actionTypes.ADD_DIRECT_CONTACT)
const addMessage = createAction<{
  key: string
  message: { [key: string]: any }
}>(actionTypes.ADD_MESSAGE)
const setAllMessages = createAction<{
  messages: any[]
  contactAddress: string
  username: string
  key: string
}>(actionTypes.SET_ALL_MESSAGES)
const updateMessage = createAction<{ key: string; id: string; txid: string }>(
  actionTypes.UPDATE_MESSAGE
)
const setMessageBlockTime = createAction<{
  contactAddress: string
  messageId: string
  blockTime: number
}>(actionTypes.SET_MESSAGE_BLOCKTIME)
const cleanNewMessages = createAction<{ contactAddress: string }>(
  actionTypes.CLEAN_NEW_DIRECT_MESSAGESS
)
const appendNewMessages = createAction<{
  contactAddress: string
  messagesIds: string[]
}>(actionTypes.APPEND_NEW_DIRECT_MESSAGES)
const setLastSeen = createAction<{ lastSeen: DateTime; contact: Contact }>(
  actionTypes.SET_CONTACTS_LAST_SEEN
)
const setTypingIndicator = createAction<{ contactAddress: string; typingIndicator: boolean }>(
  actionTypes.SET_TYPING_INDICATOR
)
const removeContact = createAction<{ address: string }>(actionTypes.REMOVE_CONTACT)
const setUsernames = createAction<{ sender: ISender }>(actionTypes.SET_CONTACTS_USERNAMES)
const setVaultMessages = createAction(actionTypes.SET_VAULT_DIRECT_MESSAGES)
const setContactConnected = createAction(actionTypes.SET_CONTACT_CONNECTED)

export const actions = {
  setMessages,
  setChannelMessages,
  setAllMessages,
  updateMessage,
  addMessage,
  addContact,
  addDirectContact,
  setVaultMessages,
  cleanNewMessages,
  appendNewMessages,
  setLastSeen,
  setUsernames,
  removeContact,
  setMessageBlockTime,
  setContactConnected,
  setTypingIndicator
}
export type ContactActions = ActionsType<typeof actions>

export const loadContact = address => async (dispatch, getState) => {
  console.log('loadContact')
  const contact = selectors.contact(address)(getState())
  dispatch(updateLastSeen({ contact }))
}
export const updatePendingMessage = ({ key, id, txid }) => async dispatch => {
  dispatch(updateMessage({ key, id, txid }))
}
export const linkUserRedirect = contact => async (dispatch, getState) => {
  const contacts = selectors.contacts(getState())
  if (contacts[contact.nickname]) {
    history.push(`/main/direct-messages/${contact.nickname}`)
  }
  await dispatch(
    setUsernames({
      sender: {
        replyTo: contact.address,
        username: contact.nickname
      }
    })
  )
  history.push(`/main/direct-messages/${contact.nickname}`)
}

export const updateLastSeen = ({ contact }) => async (dispatch, getState) => {
  console.log('updateLastSeen')
  const lastSeen = DateTime.utc()
  const unread = selectors.newMessages(contact.address)(getState()).length
  remote.app.badgeCount = remote.app.badgeCount - unread
  dispatch(cleanNewMessages({ contactAddress: contact.username }))
  dispatch(cleanNewMessages({ contactAddress: contact.address }))
  dispatch(
    setLastSeen({
      lastSeen,
      contact
    })
  )
}

export const createVaultContact = ({ contact, history, redirect = true }) => async (
  dispatch,
  getState
) => {
  const contacts = selectors.contacts(getState())
  if (!contacts[contact.nickname]) {
    await dispatch(
      addDirectContact({
        key: contact.publicKey,
        username: contact.nickname,
        contactAddress: contact.address
      })
    )
  }
  if (redirect) {
    history.push(`/main/direct-messages/${contact.nickname}`)
  }
}

export const deleteChannel = ({ address, history }) => async dispatch => {
  history.push('/main/channel/general')
  dispatch(removeContact(address))
}

export const epics = {
  updateLastSeen,
  loadContact,
  createVaultContact,
  deleteChannel,
  linkUserRedirect
}

export const reducer = handleActions<ContactsStore, PayloadType<ContactActions>>(
  {
    [setMessages.toString()]: (
      state,
      { payload: { key, username, contactAddress, messages } }: ContactActions['setMessages']
    ) =>
      produce(state, draft => {
        if (!draft[username]) {
          draft[username] = {
            lastSeen: null,
            messages: [],
            newMessages: [],
            vaultMessages: [],
            offerId: null,
            key,
            address: contactAddress,
            username,
            typingIndicator: false
          }
        }
        draft[username].messages = {
          ...draft[username].messages,
          ...messages
        }
      }),
    [setChannelMessages.toString()]: (
      state,
      { payload: { key, username, contactAddress, messages } }: ContactActions['setChannelMessages']
    ) =>
      produce(state, draft => {
        if (!draft[key]) {
          draft[key] = {
            lastSeen: null,
            messages: [],
            newMessages: [],
            vaultMessages: [],
            offerId: null,
            key,
            address: contactAddress,
            username,
            typingIndicator: false
          }
        }
        draft[key].messages = {
          ...draft[key].messages,
          ...messages
        }
      }),
    [setAllMessages.toString()]: (
      state,
      { payload: { key, username, contactAddress, messages } }: ContactActions['setAllMessages']
    ) =>
      produce(state, draft => {
        if (!draft[key]) {
          draft[key] = {
            lastSeen: null,
            messages: [],
            newMessages: [],
            vaultMessages: [],
            offerId: null,
            key,
            address: contactAddress,
            username,
            typingIndicator: false
          }
        }
        draft[key].messages = {
          ...messages
        }
      }),
    [addContact.toString()]: (
      state,
      { payload: { key, username, contactAddress, offerId = null } }: ContactActions['addContact']
    ) =>
      produce(state, draft => {
        if (key === 'zbay') return
        draft[key] = {
          lastSeen: null,
          messages: [],
          newMessages: [],
          vaultMessages: [],
          offerId: offerId,
          key,
          address: contactAddress,
          username,
          typingIndicator: false
        }
      }),
    [addDirectContact.toString()]: (
      state,
      {
        payload: { key, username, contactAddress, offerId = null }
      }: ContactActions['addDirectContact']
    ) =>
      produce(state, draft => {
        if (username === 'zbay') return
        draft[username] = {
          lastSeen: null,
          messages: [],
          newMessages: [],
          vaultMessages: [],
          offerId: offerId,
          key,
          address: contactAddress,
          username,
          typingIndicator: false
        }
      }),
    [addMessage.toString()]: (state, { payload: { key, message } }: ContactActions['addMessage']) =>
      produce(state, draft => {
        const messageId = Object.keys(message)[0]
        if (!(messageId in draft[key].messages)) {
          draft[key].messages = {
            ...draft[key].messages,
            ...message
          }
        }
      }),
    [updateMessage.toString()]: (
      state,
      { payload: { key, id, txid } }: ContactActions['updateMessage']
    ) =>
      produce(state, draft => {
        const tempMsg = draft[key].messages[id]
        delete draft[key].messages[id]
        draft[key].messages[txid] = tempMsg
      }),
    [cleanNewMessages.toString()]: (
      state,
      { payload: { contactAddress } }: ContactActions['cleanNewMessages']
    ) =>
      produce(state, draft => {
        if (!draft[contactAddress]) return
        draft[contactAddress].newMessages = []
      }),
    [appendNewMessages.toString()]: (
      state,
      { payload: { contactAddress, messagesIds } }: ContactActions['appendNewMessages']
    ) =>
      produce(state, draft => {
        draft[contactAddress].newMessages = draft[contactAddress].newMessages.concat(messagesIds)
        remote.app.setBadgeCount(remote.app.getBadgeCount() + messagesIds.length)
      }),
    [setLastSeen.toString()]: (
      state,
      { payload: { lastSeen, contact } }: ContactActions['setLastSeen']
    ) =>
      produce(state, draft => {
        draft[contact.key].lastSeen = lastSeen
      }),
    [removeContact.toString()]: (
      state,
      { payload: { address } }: ContactActions['removeContact']
    ) =>
      produce(state, draft => {
        delete draft[address]
      }),
    [setUsernames.toString()]: (state, { payload: { sender } }: ContactActions['setUsernames']) =>
      produce(state, draft => {
        draft[sender.replyTo].username = sender.username
        draft[sender.replyTo].address = sender.replyTo
      })
  },
  initialState
)

export default {
  epics,
  actions,
  reducer
}
