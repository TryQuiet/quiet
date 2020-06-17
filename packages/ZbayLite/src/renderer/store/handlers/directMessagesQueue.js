import Immutable from 'immutable'
import * as R from 'ramda'
import crypto from 'crypto'
import { createAction, handleActions } from 'redux-actions'

import selectors from '../selectors/directMessagesQueue'
import operationsSelectors from '../selectors/operations'
import identitySelectors from '../selectors/identity'
import contactsSelectors from '../selectors/contacts'
import usersSelectors from '../selectors/users'
import appSelectors from '../selectors/app'
import offersSelectors from '../selectors/offers'
import { createStandardMemo } from '../../zbay/transit'
import { messageToTransfer, createEmptyTransfer } from '../../zbay/messages'
import { messageType, actionTypes } from '../../../shared/static'
import operationsHandlers, {
  PendingDirectMessageOp,
  operationTypes
} from './operations'
import notificationsHandlers from './notifications'
import appHandlers from './app'
import { errorNotification } from './utils'
import { getClient } from '../../zcash'
import { getVault } from '../../vault'
import contactsHandlers from './contacts'
import offersHandlers from './offers'
import history from '../../../shared/history'

export const DEFAULT_DEBOUNCE_INTERVAL = 2000
const POLLING_OFFSET = 60000

export const PendingMessage = Immutable.Record(
  {
    recipientAddress: '',
    recipientUsername: '',
    offerId: '',
    message: null
  },
  'PendingDirectMessage'
)

export const initialState = Immutable.Map()

const addDirectMessage = createAction(
  actionTypes.ADD_PENDING_DIRECT_MESSAGE,
  ({ message, recipientAddress, recipientUsername }) => {
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
  }
)
const removeMessage = createAction(actionTypes.REMOVE_PENDING_DIRECT_MESSAGE)

export const actions = {
  addDirectMessage,
  removeMessage
}

export const checkConfirmationNumber = async ({
  opId,
  status,
  txId,
  dispatch,
  getState
}) => {
  const { meta: message } = operationsSelectors
    .pendingDirectMessages(getState())
    .get(opId)
    .toJS()
  const { id, address, name, signerPubKey } = identitySelectors
    .identity(getState())
    .toJS().data
  const userData = usersSelectors.registeredUser(signerPubKey)(getState())
  const messageContent = message.message
  const { recipientAddress, recipientUsername } = message
  const item = offersSelectors.offer(
    messageContent.message.itemId + recipientUsername
  )(getState())
  if (item) {
    await getVault().offers.saveMessage({
      identityAddress: address,
      identityName: userData ? userData.nickname : name,
      message: messageContent,
      recipientAddress,
      recipientUsername,
      status,
      txId
    })
    await dispatch(
      offersHandlers.epics.refreshMessages(
        messageContent.message.itemId + recipientUsername
      )
    )
    await dispatch(operationsHandlers.actions.removeOperation(opId))
  } else {
    if (address !== recipientAddress) {
      await getVault().contacts.saveMessage({
        identityId: id,
        identityAddress: address,
        identityName: userData ? userData.nickname : name,
        message: messageContent,
        recipientAddress,
        recipientUsername,
        status,
        txId
      })
    }
    if (message.saveAdvert) {
      const payload = {
        id: txId,
        sender: {
          username: userData ? userData.nickname : name,
          replyTo: address
        },
        ...message.message
      }
      await getVault().adverts.addAdvert(payload)
    }
    const { username } = contactsSelectors.contact(recipientAddress)(getState())
    if (!username) {
      dispatch(
        contactsHandlers.actions.setUsernames({
          sender: {
            replyTo: recipientAddress,
            username: recipientUsername || recipientAddress.substring(0, 15)
          }
        })
      )
    }
    dispatch(operationsHandlers.actions.removeOperation(opId))
    dispatch(
      contactsHandlers.epics.loadVaultMessages({
        contact: {
          replyTo: recipientAddress,
          username: recipientUsername
        }
      })
    )
    const subscribe = async callback => {
      async function poll () {
        const { confirmations, error = null } =
          (await getClient().confirmations.getResult(txId)) || {}
        if (confirmations >= 1) {
          return callback(error, { confirmations })
        } else {
          setTimeout(poll, POLLING_OFFSET)
        }
      }
      return poll()
    }

    return subscribe(async (error, { confirmations }) => {
      await getVault().contacts.updateMessage({
        identityId: id,
        messageId: txId,
        recipientAddress,
        recipientUsername,
        newMessageStatus: 'broadcasted'
      })
      dispatch(
        contactsHandlers.epics.loadVaultMessages({
          contact: {
            replyTo: recipientAddress,
            username: recipientUsername
          }
        })
      )
      if (error) {
        await getVault().contacts.updateMessage({
          identityId: id,
          messageId: txId,
          recipientAddress,
          recipientUsername,
          newMessageStatus: error
        })
      }
    })
  }
}

const sendPlainTransfer = payload => async (dispatch, getState) => {
  const identityAddress = identitySelectors.address(getState())
  const { destination, amount, memo } = payload
  if (memo) {
    const hexMemo = await createStandardMemo(memo)
    const transfer = createEmptyTransfer({
      address: destination,
      amount: amount,
      identityAddress,
      memo: hexMemo
    })
    await getClient().payment.send(transfer)
  } else {
    const transfer = createEmptyTransfer({
      address: destination,
      amount: amount,
      identityAddress
    })
    await getClient().payment.send(transfer)
  }
}

const _sendPendingDirectMessages = redirect => async (dispatch, getState) => {
  const lock = appSelectors.directMessageQueueLock(getState())
  const messages = selectors.queue(getState())
  if (lock === false) {
    await dispatch(appHandlers.actions.lockDmQueue())
  } else {
    if (messages.size !== 0) {
      dispatch(sendPendingDirectMessages(null, redirect))
    }
    return
  }
  const identityAddress = identitySelectors.address(getState())
  const donation = identitySelectors.donation(getState())
  await Promise.all(
    messages
      .map(async (msg, key) => {
        const { message, recipientAddress } = msg.toJS()
        const transfer = await messageToTransfer({
          message,
          address: recipientAddress,
          amount:
            message.type === messageType.TRANSFER || messageType.ITEM_TRANSFER
              ? message.spent
              : '0',
          identityAddress,
          donation
        })
        let opId
        try {
          opId = await getClient().payment.send(transfer)
        } catch (err) {
          dispatch(
            notificationsHandlers.actions.enqueueSnackbar(
              errorNotification({
                message:
                  "Couldn't send the message, please check node connection."
              })
            )
          )
          return
        }
        if (recipientAddress.length === 35) {
          return
        }
        const { username } = contactsSelectors.contact(recipientAddress)(
          getState()
        )
        if (!username) {
          await dispatch(
            contactsHandlers.actions.setUsernames({
              sender: {
                replyTo: recipientAddress,
                username:
                  msg.recipientUsername || msg.recipientAddress.substring(0, 15)
              }
            })
          )
        }
        if (redirect) {
          history.push(
            `/main/direct-messages/${msg.recipientAddress}/${username ||
              msg.recipientUsername}`
          )
        }
        await dispatch(removeMessage(key))
        await dispatch(
          operationsHandlers.epics.observeOperation({
            opId,
            type: operationTypes.pendingDirectMessage,
            meta: PendingDirectMessageOp({
              recipientAddress: msg.recipientAddress,
              recipientUsername: msg.recipientUsername,
              offerId: msg.offerId,
              message: msg.message
            }),
            checkConfirmationNumber
          })
        )
      })
      .values()
  )
  await dispatch(appHandlers.actions.unlockDmQueue())
}

export const sendPendingDirectMessages = (debounce = null, redirect) => {
  const thunk = _sendPendingDirectMessages(redirect)
  thunk.meta = {
    debounce: {
      time:
        debounce !== null
          ? debounce
          : process.env.ZBAY_DEBOUNCE_MESSAGE_INTERVAL ||
            DEFAULT_DEBOUNCE_INTERVAL,
      key: 'SEND_PENDING_DRIRECT_MESSAGES'
    }
  }
  return thunk
}

const addDirectMessageEpic = (
  payload,
  debounce,
  redirect = true
) => async dispatch => {
  await dispatch(addDirectMessage(payload))
  await dispatch(sendPendingDirectMessages(debounce, redirect))
}

export const epics = {
  sendPendingDirectMessages,
  addDirectMessage: addDirectMessageEpic,
  resetDebounceDirectMessage: sendPendingDirectMessages,
  sendPlainTransfer
}

export const reducer = handleActions(
  {
    [addDirectMessage]: (
      state,
      { payload: { recipientUsername, recipientAddress, message, key } }
    ) => {
      return state.set(
        key,
        PendingMessage({
          recipientAddress,
          recipientUsername,
          offerId: message.message.itemId,
          message: Immutable.fromJS(message)
        })
      )
    },
    [removeMessage]: (state, { payload: key }) => state.remove(key)
  },
  initialState
)

export default {
  actions,
  epics,
  reducer
}
