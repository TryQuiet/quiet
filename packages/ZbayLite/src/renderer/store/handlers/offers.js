import { produce } from 'immer'
import { createAction, handleActions } from 'redux-actions'
import { DateTime } from 'luxon'
import { remote } from 'electron'
import crypto from 'crypto'
import * as R from 'ramda'

import identitySelectors from '../selectors/identity'
import offersSelectors from '../selectors/offers'
import channelSelectors from '../selectors/channel'
import contactsSelectors from '../selectors/contacts'
import appSelectors from '../selectors/app'
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

export const Offer = {
  address: '',
  itemId: '',
  name: '',
  lastSeen: '',
  messages: [],
  newMessages: []
}

const initialState = {
  ...Offer
}

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
  if (!contacts[payload.id + payload.offerOwner]) {
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
  const channel = channelSelectors.channel(getState())
  const messageToSend = channelSelectors.message(getState())
  const useTor = appSelectors.useTor(getState())

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
      const user = [...Object.values(users)].filter(
        user => user.nickname === channel.id.substring(64)
      )[0]
      if (useTor && user && user.onionAddress) {
        try {
          const memo = await packMemo(message)
          const result = await sendMessage(memo, user.onionAddress)
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
  const unread = offersSelectors.newMessages(itemId)(getState())
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
      produce(state, (draft) => {
        if (!draft[itemId]) {
          draft[itemId] = {
            ...Offer,
            messages
          }
        } else {
          draft[itemId].messages = draft[itemId].messages.concat(messages)
        }
      }),
    [addOffer]: (state, { payload: { newOffer } }) =>
      produce(state, (draft) => {
        draft[newOffer.itemId] = newOffer
      }),
    [cleanNewMessages]: (state, { payload: { itemId } }) =>
      produce(state, (draft) => {
        draft[itemId].newMessages = []
      }),
    [appendMessages]: (state, { payload: { itemId, message } }) =>
      produce(state, (draft) => {
        if (!draft[itemId]) {
          draft[itemId] = {
            ...Offer,
            messages: [message]
          }
        } else {
          draft[itemId].messages.push(message)
        }
      }),
    [appendNewMessages]: (state, { payload: { itemId, message } }) =>
      produce(state, (draft) => {
        if (!draft[itemId]) {
          draft[itemId] = {
            ...Offer,
            newMessages: [message]
          }
        } else {
          draft[itemId].newMessages.push(message)
        }
      }),
    [setLastSeen]: (state, { payload: { itemId, lastSeen } }) =>
      produce(state, (draft) => {
        if (!draft[itemId]) {
          draft[itemId] = {
            ...Offer,
            lastSeen: lastSeen
          }
        } else {
          draft[itemId].lastSeen = lastSeen
        }
      }),
    [setOfferMessageBlockTime]: (
      state,
      { payload: { itemId, messageId, blockTime } }
    ) =>
      produce(state, (draft) => {
        const index = messages.findIndex(msg => msg.id === messageId)
        draft[itemId].messages[index].blockTime = blockTime
      })
  },
  initialState
)
export default {
  actions,
  epics,
  reducer,
  loadVaultContacts
}
