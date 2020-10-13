import Immutable from 'immutable'
import { createAction, handleActions } from 'redux-actions'
import { DateTime } from 'luxon'
import { remote } from 'electron'
import crypto from 'crypto'
import * as R from 'ramda'

import identitySelectors from '../selectors/identity'
import offersSelectors from '../selectors/offers'
import channelSelectors from '../selectors/channel'
import contactsSelectors from '../selectors/contacts'
import contactsHandlers from './contacts'
import channelHandlers from './channel'
import { messageType, actionTypes } from '../../../shared/static'
import { DisplayableMessage } from '../../zbay/messages'
import { messages } from '../../zbay'
import { _checkMessageSize } from './messages'
import usersSelectors from '../selectors/users'
import operationsHandlers from './operations'
import client from '../../zcash'
import { packMemo } from '../../zbay/transit'
import { sendMessage } from '../../zcash/websocketClient'

export const Offer = Immutable.Record(
  {
    address: '',
    itemId: '',
    name: '',
    lastSeen: '',
    messages: Immutable.List(),
    newMessages: Immutable.List()
  },
  'Offer'
)
const initialState = Immutable.Map()

const setMessages = createAction(actionTypes.SET_OFFER_MESSAGES)
const addOffer = createAction(actionTypes.ADD_OFFER)
const cleanNewMessages = createAction(actionTypes.CLEAN_OFFER_NEW_MESSAGESS)
const setLastSeen = createAction(actionTypes.SET_OFFER_LAST_SEEN)
const appendMessages = createAction(actionTypes.APPEND_OFFER_MESSAGES)
const appendNewMessages = createAction(actionTypes.APPEND_NEW_OFFER_MESSAGES)
const setOfferMessageBlockTime = createAction(
  actionTypes.SET_OFFER_MESSAGE_BLOCKTIME
)

export const actions = {
  setMessages,
  addOffer,
  cleanNewMessages,
  setLastSeen,
  appendMessages,
  appendNewMessages,
  setOfferMessageBlockTime
}
const createOfferAdvert = ({ payload, history }) => async (
  dispatch,
  getState
) => {
  await dispatch(createOffer({ payload }))
  history.push(
    `/main/offers/${payload.id + payload.offerOwner}/${payload.address}`
  )
}
const createOffer = ({ payload }) => async (dispatch, getState) => {
  const contacts = contactsSelectors.contacts(getState())
  const msg = contactsSelectors.getAdvertById(payload.id)(getState())
  if (!contacts.get(payload.id + payload.offerOwner)) {
    await dispatch(
      contactsHandlers.actions.addContact({
        key: payload.id + payload.offerOwner,
        username: payload.tag + ' @' + payload.offerOwner,
        contactAddress: payload.address,
        offerId: payload.id
      })
    )
    if (msg) {
      await dispatch(
        contactsHandlers.actions.addMessage({
          key: payload.id + payload.offerOwner,
          message: { [msg.id]: msg }
        })
      )
    }
  }
}
export const loadVaultContacts = () => async (dispatch, getState) => {}

export const initMessage = () => async (dispatch, getState) => {}
const refreshMessages = id => async (dispatch, getState) => {}

const sendItemMessageOnEnter = event => async (dispatch, getState) => {
  const enterPressed = event.nativeEvent.keyCode === 13
  const shiftPressed = event.nativeEvent.shiftKey === true
  const channel = channelSelectors.channel(getState()).toJS()
  const messageToSend = channelSelectors.message(getState())
  let message
  if (enterPressed && !shiftPressed) {
    event.preventDefault()
    const privKey = identitySelectors.signerPrivKey(getState())
    message = messages.createMessage({
      messageData: {
        type: messageType.ITEM_BASIC,
        data: {
          itemId: channel.id.substring(0, 64),
          text: messageToSend
        }
      },
      privKey: privKey
    })
    const isMergedMessageTooLong = await dispatch(
      _checkMessageSize(message.message)
    )
    if (!isMergedMessageTooLong) {
      dispatch(channelHandlers.actions.setMessage(''))
      const myUser = usersSelectors.myUser(getState())
      const messageDigest = crypto.createHash('sha256')

      const messageEssentials = R.pick(['createdAt', 'message', 'spent'])(
        message
      )
      const key = messageDigest
        .update(JSON.stringify(messageEssentials))
        .digest('hex')

      const messagePlaceholder = DisplayableMessage({
        ...message,
        id: key,
        sender: {
          replyTo: myUser.address,
          username: myUser.nickname
        },
        fromYou: true,
        status: 'pending',
        message: messageToSend
      })
      dispatch(
        contactsHandlers.actions.addMessage({
          key: channel.id,
          message: { [key]: messagePlaceholder }
        })
      )
      dispatch(
        operationsHandlers.actions.addOperation({
          channelId: channel.id,
          id: key
        })
      )
      const users = usersSelectors.users(getState())
      const user = [...users.values()].filter(
        user => user.nickname === channel.id.substring(64)
      )[0]
      if (user && user.onionAddress) {
        try {
          const memo = await packMemo(message)
          const result = await sendMessage(
            memo,
            user.onionAddress
          )
          if (result === -1) {
            throw new Error('unable to connect')
          }
          return
        } catch (error) {
          console.log(error)
          console.log('socket timeout')
        }
      }
      const identityAddress = identitySelectors.address(getState())
      const transfer = await messages.messageToTransfer({
        message: message,
        address: channel.address,
        identityAddress
      })
      const transaction = await client.sendTransaction(transfer)
      dispatch(
        operationsHandlers.epics.resolvePendingOperation({
          channelId: channel.id,
          id: key,
          txid: transaction.txid
        })
      )
    }
  }
}
const updateLastSeen = ({ itemId }) => async (dispatch, getState) => {
  const lastSeen = DateTime.utc()
  const unread = offersSelectors.newMessages(itemId)(getState()).size
  remote.app.badgeCount = remote.app.badgeCount - unread
  dispatch(setLastSeen({ itemId, lastSeen }))
  dispatch(cleanNewMessages({ itemId }))
}
export const epics = {
  createOfferAdvert,
  loadVaultContacts,
  initMessage,
  sendItemMessageOnEnter,
  // sendItemTransferMessage,
  refreshMessages,
  createOffer,
  updateLastSeen
}

export const reducer = handleActions(
  {
    [setMessages]: (state, { payload: { itemId, messages } }) =>
      state.update(itemId, Offer(), item =>
        item.set('messages', item.messages.concat(messages))
      ),
    [addOffer]: (state, { payload: { newOffer } }) =>
      state.merge({ [newOffer.itemId]: newOffer }),
    [cleanNewMessages]: (state, { payload: { itemId } }) =>
      state.update(itemId, Offer(), item =>
        item.set('newMessages', Immutable.List())
      ),
    [appendMessages]: (state, { payload: { itemId, message } }) =>
      state.update(itemId, Offer(), item =>
        item.set('messages', item.messages.push(message))
      ),
    [appendNewMessages]: (state, { payload: { itemId, message } }) =>
      state.update(itemId, Offer(), item =>
        item.set('newMessages', item.newMessages.push(message))
      ),
    [setLastSeen]: (state, { payload: { itemId, lastSeen } }) =>
      state.update(itemId, Offer(), item => item.set('lastSeen', lastSeen)),
    [setOfferMessageBlockTime]: (
      state,
      { payload: { itemId, messageId, blockTime } }
    ) =>
      state.update(itemId, Offer(), cm =>
        cm.update('messages', messages => {
          const index = messages.findIndex(msg => msg.id === messageId)
          return messages.setIn([index, 'blockTime'], blockTime)
        })
      )
  },
  initialState
)
export default {
  actions,
  epics,
  reducer,
  loadVaultContacts
}
