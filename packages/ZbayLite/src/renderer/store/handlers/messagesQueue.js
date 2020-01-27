import Immutable from 'immutable'
import * as R from 'ramda'
import crypto from 'crypto'
import { createAction, handleActions } from 'redux-actions'

import selectors from '../selectors/messagesQueue'
import channelsSelectors from '../selectors/channels'
import identitySelectors from '../selectors/identity'
import { messageToTransfer } from '../../zbay/messages'
import operationsHandlers, { PendingMessageOp, operationTypes } from './operations'
import notificationsHandlers from './notifications'
import { errorNotification } from './utils'
import { getClient } from '../../zcash'
import { actionTypes } from '../../../shared/static'

export const DEFAULT_DEBOUNCE_INTERVAL = 3000

export const PendingMessage = Immutable.Record({
  channelId: '',
  message: null
}, 'PendingMessage')

export const initialState = Immutable.Map()

const addMessage = createAction(actionTypes.ADD_PENDING_MESSAGE, ({ message, channelId }) => {
  const messageDigest = crypto.createHash('sha256')
  const messageEssentials = R.pick(['type', 'sender'])(message)
  return {
    key: messageDigest.update(
      JSON.stringify({
        ...messageEssentials,
        channelId
      })
    ).digest('hex'),
    message,
    channelId
  }
})
const removeMessage = createAction(actionTypes.REMOVE_PENDING_MESSAGE)

export const actions = {
  addMessage,
  removeMessage
}

const _sendPendingMessages = async (dispatch, getState) => {
  const messages = selectors.queue(getState())
  const donation = identitySelectors.donation(getState())
  await Promise.all(
    messages.map(async (msg, key) => {
      const channel = channelsSelectors.channelById(msg.channelId)(getState())
      const identityAddress = identitySelectors.address(getState())
      const transfer = await messageToTransfer({
        message: msg.message.toJS(),
        address: channel.get('address'),
        identityAddress,
        donation
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
      dispatch(removeMessage(key))
      await dispatch(operationsHandlers.epics.observeOperation({
        opId,
        type: operationTypes.pendingMessage,
        meta: PendingMessageOp({
          channelId: channel.get('id'),
          message: msg.message
        })
      }))
    }).values()
  )
}

const sendPendingMessages = () => {
  const thunk = _sendPendingMessages
  thunk.meta = {
    debounce: {
      time: process.env.ZBAY_DEBOUNCE_MESSAGE_INTERVAL || DEFAULT_DEBOUNCE_INTERVAL,
      key: 'SEND_PENDING_MESSAGES'
    }
  }
  return thunk
}

const addMessageEpic = (payload) => async (dispatch) => {
  dispatch(addMessage(payload))
  await dispatch(sendPendingMessages())
}

export const epics = {
  sendPendingMessages,
  addMessage: addMessageEpic
}

export const reducer = handleActions({
  [addMessage]: (state, { payload: { channelId, message, key } }) => {
    return state.set(key, PendingMessage({
      channelId,
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
