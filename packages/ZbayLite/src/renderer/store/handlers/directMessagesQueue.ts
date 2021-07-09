import { produce, immerable } from 'immer'
import * as R from 'ramda'
import crypto from 'crypto'
import { createAction, handleActions } from 'redux-actions'

import selectors from '../selectors/directMessagesQueue'
import identitySelectors from '../selectors/identity'
import contactsSelectors from '../selectors/contacts'
import usersSelectors from '../selectors/users'
import appSelectors from '../selectors/app'
import operationsHandlers from './operations'
import { messageToTransfer, createEmptyTransfer, createMessage } from '../../zbay/messages'
import { messageType, actionTypes } from '../../../shared/static'
import notificationsHandlers from './notifications'
import appHandlers from './app'
import { errorNotification } from './utils'
import client from '../../zcash'
import contactsHandlers from './contacts'
import history from '../../../shared/history'
import { ActionsType, PayloadType } from './types'

import { DisplayableMessage } from '../../zbay/messages.types'

import { ZbayThunkAction } from './helpers'

export const DEFAULT_DEBOUNCE_INTERVAL = 2000

export const PendingMessage = {
  recipientAddress: '',
  recipientUsername: '',
  offerId: '',
  message: null
}

export class DirectMessagesQueue {
  recipientAddress: string = ''
  recipientUsername: string = ''
  offerId: string = ''
  message?: DisplayableMessage
  type: messageType

  constructor(values?: Partial<DirectMessagesQueue>) {
    Object.assign(this, values)
    this[immerable] = true
  }
}

export type DirectMessagesQueueStore = DirectMessagesQueue[]

export const initialState: DirectMessagesQueueStore = []

const addDirectMessage = createAction<
{ message: DisplayableMessage; recipientAddress: string; recipientUsername: string; key: string },
{ message: DisplayableMessage; recipientAddress: string; recipientUsername: string }
>(actionTypes.ADD_PENDING_DIRECT_MESSAGE, ({ message, recipientAddress, recipientUsername }) => {
  const messageDigest = crypto.createHash('sha256')
  const messageEssentials = R.pick(['type', 'sender', 'signature'])(message)
  const response = {
    key: messageDigest
      .update(
        JSON.stringify({
          ...messageEssentials,
          recipientAddress,
          recipientUsername
        })
      )
      .digest('hex'),
    message,
    recipientAddress,
    recipientUsername
  }
  return response
})
const removeMessage = createAction(actionTypes.REMOVE_PENDING_DIRECT_MESSAGE)

export const actions = {
  addDirectMessage,
  removeMessage
}

export type DirectMessagesQueueActions = ActionsType<typeof actions>

const sendPlainTransfer = payload => async () => {
  const { destination, amount, memo } = payload
  const transfer = createEmptyTransfer({
    address: destination,
    amount: amount,
    memo: memo
  })
  await client.sendTransaction([transfer])
}
const sendMessage = payload => async (dispatch, getState) => {
  const myUser = usersSelectors.myUser(getState())
  const messageDigest = crypto.createHash('sha256')
  // Generate unique id for txn until we get response from blockchain
  const messageEssentials = R.pick(['createdAt', 'message'])(payload)
  const privKey = identitySelectors.signerPrivKey(getState())
  const key = messageDigest.update(JSON.stringify(messageEssentials)).digest('hex')
  const message = new DisplayableMessage({
    ...payload,
    id: key,
    sender: {
      replyTo: myUser.address,
      username: myUser.nickname
    },
    fromYou: true,
    receiver: {
      replyTo: payload.receiver.address,
      username: payload.receiver.nickname
    },
    message: payload.memo
  })
  const contacts = contactsSelectors.contacts(getState())
  // Create user
  if (!contacts[payload.receiver.publicKey]) {
    await dispatch(
      contactsHandlers.actions.addContact({
        key: payload.receiver.publicKey,
        username: payload.receiver.nickname,
        contactAddress: payload.receiver.address
      })
    )
  }
  dispatch(
    contactsHandlers.actions.addMessage({
      key: payload.receiver.publicKey,
      message: { [key]: message }
    })
  )
  dispatch(
    operationsHandlers.actions.addOperation({
      channelId: payload.receiver.publicKey,
      id: key
    })
  )
  const transferMessage = createMessage({
    messageData: {
      type: payload.spent ? messageType.TRANSFER : messageType.BASIC,
      data: payload.memo,
      spent: payload.spent
    },
    privKey
  })
  const transfer = await messageToTransfer({
    address: payload.receiver.address,
    amount: payload.spent,
    message: transferMessage
  })
  const transaction = await client.sendTransaction(transfer)

  if (!transaction.txid) {
    dispatch(
      contactsHandlers.actions.addMessage({
        key: payload.receiver.publicKey,
        message: {
          [key]: new DisplayableMessage({
            ...payload,
            status: 'failed'
          })
        }
      })
    )
    dispatch(
      notificationsHandlers.actions.enqueueSnackbar(
        errorNotification({
          message: "Couldn't send the message, please check node connection."
        })
      )
    )
    return
  }
  dispatch(
    operationsHandlers.epics.resolvePendingOperation({
      channelId: payload.receiver.publicKey,
      id: key,
      txid: transaction.txid
    })
  )
}

const _sendPendingDirectMessages = (redirect): ZbayThunkAction<void> => async (
  dispatch,
  getState
) => {
  const lock = appSelectors.directMessageQueueLock(getState())
  const messages = selectors.queue(getState())
  if (!lock) {
    await dispatch(appHandlers.actions.lockDmQueue())
  } else {
    if (messages.length !== 0) {
      dispatch(sendPendingDirectMessages(null, redirect))
    }
    return
  }
  const identityAddress = identitySelectors.address(getState())
  const donation = identitySelectors.donation(getState())
  await Promise.all(
    Array.from(Object.values(messages))
      .map(async (msg, key) => {
        const { message, recipientAddress } = msg
        const transfer = await messageToTransfer({
          message,
          address: recipientAddress,
          amount:
            message.type === messageType.TRANSFER || messageType.ITEM_TRANSFER
              ? message.spent.toNumber()
              : 0,
          identityAddress,
          donation
        })
        try {
          await client().payment.send(transfer)
        } catch (err) {
          dispatch(
            notificationsHandlers.actions.enqueueSnackbar(
              errorNotification({
                message: "Couldn't send the message, please check node connection."
              })
            )
          )
          return
        }
        if (recipientAddress.length === 35) {
          return
        }
        const { username } = contactsSelectors.contact(recipientAddress)(getState())
        if (!username) {
          await dispatch(
            contactsHandlers.actions.setUsernames({
              sender: {
                replyTo: recipientAddress,
                username: msg.recipientUsername || msg.recipientAddress.substring(0, 15)
              }
            })
          )
        }
        if (redirect) {
          history.push(
            `/main/direct-messages/${msg.recipientAddress}/${username || msg.recipientUsername}`
          )
        }
        await dispatch(removeMessage(key))
      })
      .values()
  )
  await dispatch(appHandlers.actions.unlockDmQueue())
}

export const sendPendingDirectMessages = (debounce?: number, redirect?: boolean) => {
  const thunk = _sendPendingDirectMessages(redirect)
  thunk.meta = {
    debounce: {
      time:
        debounce !== null
          ? debounce
          : Number(process.env.ZBAY_DEBOUNCE_MESSAGE_INTERVAL) || DEFAULT_DEBOUNCE_INTERVAL,
      key: 'SEND_PENDING_DRIRECT_MESSAGES'
    }
  }
  return thunk
}

const addDirectMessageEpic = (payload, debounce = null, redirect = true) => async dispatch => {
  await dispatch(addDirectMessage(payload))
  await dispatch(sendPendingDirectMessages(debounce, redirect))
}

export const epics = {
  sendPendingDirectMessages,
  sendMessage,
  addDirectMessage: addDirectMessageEpic,
  resetDebounceDirectMessage: sendPendingDirectMessages,
  sendPlainTransfer
}

export const reducer = handleActions<
DirectMessagesQueueStore,
PayloadType<DirectMessagesQueueActions>
>(
  {
    [addDirectMessage.toString()]: (
      state,
      {
        payload: { recipientUsername, recipientAddress, message, key }
      }: DirectMessagesQueueActions['addDirectMessage']
    ) =>
      produce(state, draft => {
        draft[key] = {
          ...PendingMessage,
          recipientAddress,
          recipientUsername,
          offerId: '',
          message: {
            ...message
          }
        }
      }),
    [removeMessage.toString()]: (
      state,
      { payload: key }: DirectMessagesQueueActions['removeMessage']
    ) =>
      produce(state, draft => {
        delete draft[key]
      })
  },
  initialState
)

export default {
  actions,
  epics,
  reducer
}
