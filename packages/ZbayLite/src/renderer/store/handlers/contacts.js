
import Immutable from 'immutable'
import { DateTime } from 'luxon'
import { createAction, handleActions } from 'redux-actions'
import * as R from 'ramda'
import BigNumber from 'bignumber.js'

import identitySelectors from '../selectors/identity'
import nodeSelectors from '../selectors/node'
import selectors, { Contact } from '../selectors/contacts'
import { directMessageChannel } from '../selectors/directMessageChannel'
import { messages as zbayMessages } from '../../zbay'
import { getClient } from '../../zcash'
import { getVault } from '../../vault'
import { displayDirectMessageNotification } from '../../notifications'
import { ReceivedMessage } from './messages'
import directMessagesQueueHandlers from './directMessagesQueue'
import channelHandlers from './channel'

const sendDirectMessageOnEnter = (event) => async (dispatch, getState) => {
  const enterPressed = event.nativeEvent.keyCode === 13
  const shiftPressed = event.nativeEvent.shiftKey === true
  if (enterPressed && !shiftPressed) {
    event.preventDefault()
    const message = zbayMessages.createMessage({
      identity: identitySelectors.data(getState()).toJS(),
      messageData: {
        type: zbayMessages.messageType.BASIC,
        data: event.target.value
      }
    })
    const channel = directMessageChannel(getState()).toJS()
    dispatch(directMessagesQueueHandlers.epics.addDirectMessage({ message, recipientAddress: channel.targetRecipientAddress, recipientUsername: channel.targetRecipientUsername }))
    dispatch(channelHandlers.actions.setMessage(''))
  }
}

const sendDirectMessage = (payload) => async (dispatch, getState) => {
  const { spent, type, message: messageData } = payload
  const message = zbayMessages.createMessage({
    identity: identitySelectors.data(getState()).toJS(),
    messageData: {
      type,
      data: messageData,
      spent: new BigNumber(spent)
    }
  })
  const { replyTo: recipientAddress, username: recipientUsername } = payload.receiver
  dispatch(directMessagesQueueHandlers.epics.addDirectMessage({ message, recipientAddress, recipientUsername }))
}

const initialState = Immutable.Map()

const setMessages = createAction('SET_DIRECT_MESSAGES')
const setVaultMessages = createAction('SET_VAULT_DIRECT_MESSAGES')
const cleanNewMessages = createAction('CLEAN_NEW_DIRECT_MESSAGESS')
const appendNewMessages = createAction('APPEND_NEW_DIRECT_MESSAGES')
const setLastSeen = createAction('SET_CONTACTS_LAST_SEEN')

export const actions = {
  setMessages,
  setVaultMessages,
  cleanNewMessages,
  appendNewMessages,
  setLastSeen
}

export const fetchMessages = () => async (dispatch, getState) => {
  const identityAddress = identitySelectors.address(getState())
  const isTestnet = nodeSelectors.node(getState()).isTestnet
  const transfers = await getClient().payment.received(identityAddress)
  const messages = await Promise.all(transfers.map(
    async (transfer) => {
      const message = await zbayMessages.transferToMessage(transfer, isTestnet)
      return message && ReceivedMessage(message)
    }
  ))
  const senderToMessages = R.compose(
    R.groupBy(msg => msg.sender.replyTo),
    R.filter(R.identity)
  )(messages)

  await Promise.all(Object.entries(senderToMessages).map(
    async ([contactAddress, contactMessages]) => {
      const contact = contactMessages[0].sender
      await dispatch(loadVaultMessages({ contact }))
      const previousMessages = selectors.messages(contactAddress)(getState())
      let lastSeen = selectors.lastSeen(contactAddress)(getState())
      if (!lastSeen) {
        await dispatch(updateLastSeen({ contact }))
        lastSeen = selectors.lastSeen(contactAddress)(getState())
      }

      const newMessages = zbayMessages.calculateDiff({
        previousMessages,
        nextMessages: Immutable.List(contactMessages),
        lastSeen,
        identityAddress
      })

      dispatch(appendNewMessages({
        contactAddress,
        messagesIds: newMessages.map(R.prop('id'))
      }))
      dispatch(loadFechedMessages({ messages: contactMessages, contactAddress }))
      newMessages.map(nm => displayDirectMessageNotification({ message: nm, username: contact.username }))
    }
  ))
}

export const loadFechedMessages = ({ messages: contactMessages, contactAddress }) => async (dispatch, getState) => {
  const identityAddress = identitySelectors.address(getState())
  const identityName = identitySelectors.name(getState())
  const fetchedMessagesToDisplay = contactMessages.map(msg => zbayMessages.receivedToDisplayableMessage({ message: msg, identityAddress, receiver: { replyTo: identityAddress, username: identityName } }))
  dispatch(setMessages({ messages: fetchedMessagesToDisplay, contactAddress }))
}

export const updateLastSeen = ({ contact }) => async (dispatch, getState) => {
  const identityId = identitySelectors.id(getState())
  const lastSeen = DateTime.utc()
  await getVault().contacts.updateLastSeen({
    identityId,
    recipientUsername: contact.username,
    recipientAddress: contact.replyTo,
    lastSeen
  })
  dispatch(setLastSeen({
    lastSeen,
    contact
  }))
}

export const loadVaultMessages = ({ contact }) => async (dispatch, getState) => {
  const identityId = identitySelectors.id(getState())
  const identityAddress = identitySelectors.address(getState())
  const { messages: vaultMessages } = await getVault().contacts.listMessages({ identityId, recipientUsername: contact.username, recipientAddress: contact.replyTo })
  const vaultMessagesToDisplay = vaultMessages.map(msg => zbayMessages.vaultToDisplayableMessage({ message: msg, identityAddress, receiver: { replyTo: contact.replyTo, username: contact.username } }))
  dispatch(setVaultMessages({
    contactAddress: contact.replyTo,
    vaultMessagesToDisplay
  }))
}

export const loadAllSentMessages = () => async (dispatch, getState) => {
  const identityId = identitySelectors.id(getState())
  const identityAddress = identitySelectors.address(getState())
  const allMessages = await getVault().contacts.loadAllSentMessages({ identityId })
  allMessages.forEach(contact => {
    const vaultMessagesToDisplay = contact.messages.map(msg => zbayMessages.vaultToDisplayableMessage({ message: msg, identityAddress, receiver: { replyTo: contact.address, username: contact.username } }))
    dispatch(setVaultMessages({
      contactAddress: contact.address,
      vaultMessagesToDisplay
    }))
    dispatch(setLastSeen({
      lastSeen: null,
      contact: {
        replyTo: contact.address,
        username: contact.address.substring(0, 10)
      }
    }))
  })
}

export const epics = {
  fetchMessages,
  updateLastSeen,
  sendDirectMessage,
  loadVaultMessages,
  sendDirectMessageOnEnter,
  loadAllSentMessages
}

export const reducer = handleActions({
  [setMessages]: (state, { payload: { contactAddress, messages } }) => state.update(
    contactAddress,
    Contact(),
    cm => cm.set('messages', Immutable.fromJS(messages))
  ),
  [setVaultMessages]: (state, { payload: { contactAddress, vaultMessagesToDisplay } }) => state.update(
    contactAddress,
    Contact(),
    cm => cm.set('vaultMessages', Immutable.fromJS(vaultMessagesToDisplay))
  ),
  [cleanNewMessages]: (state, { payload: { contactAddress } }) => {
    const newState = state.update(
      contactAddress,
      Contact(),
      cm => cm.set('newMessages', Immutable.List())
    )
    return newState
  },
  [appendNewMessages]: (state, { payload: { contactAddress, messagesIds } }) => state.update(
    contactAddress,
    Contact(),
    cm => cm.update('newMessages', nm => nm.concat(messagesIds))),
  [setLastSeen]: (state, { payload: { lastSeen, contact } }) => state.update(
    contact.replyTo,
    Contact(),
    cm => cm.set('lastSeen', lastSeen)
      .set('username', contact.username)
      .set('address', contact.replyTo)
  )
}, initialState)

export default {
  epics,
  actions,
  reducer
}
