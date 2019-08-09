import Immutable from 'immutable'
import { DateTime } from 'luxon'
import { createAction, handleActions } from 'redux-actions'
import * as R from 'ramda'

import identitySelectors from '../selectors/identity'
import nodeSelectors from '../selectors/node'
import selectors, { Contact } from '../selectors/contacts'
import { messages as zbayMessages } from '../../zbay'
import { getClient } from '../../zcash'
import { getVault } from '../../vault'
import { displayDirectMessageNotification } from '../../notifications'
import { ReceivedMessage } from './messages'

const initialState = Immutable.Map()

const setMessages = createAction('SET_DIRECT_MESSAGES')
const cleanNewMessages = createAction('CLEAN_NEW_DIRECT_MESSAGESS')
const appendNewMessages = createAction('APPEND_NEW_DIRECT_MESSAGES')
const setLastSeen = createAction('SET_CONTACTS_LAST_SEEN')

export const actions = {
  setMessages,
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
      dispatch(setMessages({ messages: contactMessages, contactAddress }))
      newMessages.map(nm => displayDirectMessageNotification({ message: nm, username: contact.username }))
    }
  ))
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

export const epics = {
  fetchMessages,
  updateLastSeen
}

export const reducer = handleActions({
  [setMessages]: (state, { payload: { contactAddress, messages } }) => state.update(
    contactAddress,
    Contact(),
    cm => cm.set('messages', Immutable.fromJS(messages))
  ),
  [cleanNewMessages]: (state, { payload: { contactAddress } }) => state.update(
    contactAddress,
    Contact(),
    cm => cm.set('newMessages', Immutable.List())
  ),
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
