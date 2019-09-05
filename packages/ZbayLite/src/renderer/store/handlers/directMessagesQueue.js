import Immutable from 'immutable'
import * as R from 'ramda'
import crypto from 'crypto'
import { createAction, handleActions } from 'redux-actions'
import BigNumber from 'bignumber.js'

import selectors from '../selectors/directMessagesQueue'
import operationsSelectors from '../selectors/operations'
import identitySelectors from '../selectors/identity'
import contactsSelectors from '../selectors/contacts'
import usersSelectors from '../selectors/users'
import { messageToTransfer, messageType } from '../../zbay/messages'
import operationsHandlers, { PendingDirectMessageOp, operationTypes } from './operations'
import notificationsHandlers from './notifications'
import { errorNotification } from './utils'
import { getClient } from '../../zcash'
import { getVault } from '../../vault'
import contactsHandlers from './contacts'

export const DEFAULT_DEBOUNCE_INTERVAL = 3000
const POLLING_OFFSET = 60000

export const PendingMessage = Immutable.Record({
  recipientAddress: '',
  recipientUsername: '',
  message: null
}, 'PendingDirectMessage')

export const initialState = Immutable.Map()

const addDirectMessage = createAction('ADD_PENDING_DIRECT_MESSAGE', ({ message, recipientAddress, recipientUsername }) => {
  const messageDigest = crypto.createHash('sha256')
  const messageEssentials = R.pick(['type', 'sender'])(message)
  const response = {
    key: messageDigest.update(
      JSON.stringify({
        ...messageEssentials,
        recipientAddress,
        recipientUsername
      })
    ).digest('hex'),
    message,
    recipientAddress,
    recipientUsername
  }
  return response
})
const removeMessage = createAction('REMOVE_PENDING_DIRECT_MESSAGE')

export const actions = {
  addDirectMessage,
  removeMessage
}

export const checkConfirmationNumber = async ({ opId, status, txId, dispatch, getState }) => {
  const { meta: message } = operationsSelectors.pendingDirectMessages(getState()).get(opId).toJS()
  const { id, address, name, signerPubKey } = identitySelectors.identity(getState()).toJS().data
  const userData = usersSelectors.registeredUser(signerPubKey)(getState())
  const messageContent = message.message
  const { recipientAddress, recipientUsername } = message
  await getVault().contacts.saveMessage({
    identityId: id,
    identityAddress: address,
    identityName: userData ? userData.nickname : name,
    message: messageContent,
    recipientAddress,
    recipientUsername,
    status,
    txId })
  const { username } = contactsSelectors.contact(recipientAddress)(getState())
  if (!username) {
    dispatch(
      contactsHandlers.actions.setUsernames({
        sender: {
          replyTo: recipientAddress,
          username: recipientAddress.substring(0, 10)
        }
      })
    )
  }
  dispatch(operationsHandlers.actions.removeOperation(opId))
  dispatch(contactsHandlers.epics.loadVaultMessages({ contact: {
    replyTo: recipientAddress,
    username: recipientUsername
  } }))
  const subscribe = async (callback) => {
    async function poll () {
      const { confirmations, error = null } = await getClient().confirmations.getResult(txId) || {}
      if (confirmations >= 1) {
        return callback(error, { confirmations })
      } else {
        setTimeout(poll, POLLING_OFFSET)
      }
    }
    return poll()
  }

  return subscribe(async (error, { confirmations }) => {
    await getVault().contacts.updateMessage({ identityId: id, messageId: txId, recipientAddress, recipientUsername, newMessageStatus: 'broadcasted' })
    dispatch(contactsHandlers.epics.loadVaultMessages({ contact: {
      replyTo: recipientAddress,
      username: recipientUsername
    } }))
    if (error) {
      await getVault().contacts.updateMessage({ identityId: id, messageId: txId, recipientAddress, recipientUsername, newMessageStatus: error })
    }
  })
}

const _sendPendingDirectMessages = async (dispatch, getState) => {
  const messages = selectors.queue(getState())
  const identityAddress = identitySelectors.address(getState())
  await Promise.all(
    messages.map(async (msg, key) => {
      const { message, recipientAddress } = msg.toJS()
      const transfer = await messageToTransfer({
        message,
        recipientAddress,
        amount: message.type === messageType.TRANSFER ? message.spent : new BigNumber('0.0001'),
        identityAddress
      })
      let opId
      try {
        opId = await getClient().payment.send(transfer)
      } catch (err) {
        dispatch(notificationsHandlers.actions.enqueueSnackbar(
          errorNotification({
            message: 'Couldn\'t send the message, please check node connection.'
          })
        ))
        return
      }
      if (recipientAddress.length === 35) {
        return
      }
      dispatch(removeMessage(key))
      await dispatch(operationsHandlers.epics.observeOperation({
        opId,
        type: operationTypes.pendingDirectMessage,
        meta: PendingDirectMessageOp({
          recipientAddress: msg.recipientAddress,
          recipientUsername: msg.recipientUsername,
          message: msg.message
        }),
        checkConfirmationNumber
      }))
    }).values()
  )
}

const sendPendingDirectMessages = () => {
  const thunk = _sendPendingDirectMessages
  thunk.meta = {
    debounce: {
      time: process.env.ZBAY_DEBOUNCE_MESSAGE_INTERVAL || DEFAULT_DEBOUNCE_INTERVAL,
      key: 'SEND_PENDING_DRIRECT_MESSAGES'
    }
  }
  return thunk
}

const addDirectMessageEpic = (payload) => async (dispatch) => {
  dispatch(addDirectMessage(payload))
  await dispatch(sendPendingDirectMessages())
}

export const epics = {
  sendPendingDirectMessages,
  addDirectMessage: addDirectMessageEpic
}

export const reducer = handleActions({
  [addDirectMessage]: (state, { payload: { recipientUsername, recipientAddress, message, key } }) => {
    if (state.has(key)) {
      return state.updateIn([key, 'message', 'message'], m => [m, message.message].join('\n'))
    }
    return state.set(key, PendingMessage({
      recipientAddress,
      recipientUsername,
      message: Immutable.fromJS(message)
    }))
  },
  [removeMessage]: (state, { payload: key }) => state.remove(key)
}, initialState)

export default {
  actions,
  epics,
  reducer
}
