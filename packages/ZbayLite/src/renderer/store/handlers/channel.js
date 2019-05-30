import Immutable from 'immutable'
import BigNumber from 'bignumber.js'
import * as R from 'ramda'
import { createAction, handleActions } from 'redux-actions'

import pendingMessagesHandlers from './pendingMessages'
import notificationsHandlers from './notifications'
import channelSelectors from '../selectors/channel'
import identitySelectors from '../selectors/identity'
import nodeSelectors from '../selectors/node'
import pendingMessagesSelectors from '../selectors/pendingMessages'
import { getClient } from '../../zcash'
import { messages } from '../../zbay'
import { errorNotification } from './utils'

export const MessagesState = Immutable.Record({
  loading: false,
  data: Immutable.List(),
  errors: ''
})

export const ChannelState = Immutable.Record({
  spentFilterValue: new BigNumber(0),
  id: null,
  message: '',
  messages: MessagesState(),
  members: null
}, 'ChannelState')

export const initialState = ChannelState()

const setSpentFilterValue = createAction('SET_SPENT_FILTER_VALUE', (_, value) => value)
const setMessage = createAction('SET_CHANNEL_MESSAGE', R.path(['target', 'value']))
const setChannelId = createAction('SET_CHANNEL_ID')
const setMessages = createAction('SET_CHANNEL_MESSAGES')

export const actions = {
  setSpentFilterValue,
  setMessage,
  setChannelId
}

const loadMessages = () => async (dispatch, getState) => {
  const channel = channelSelectors.data(getState())
  const isTestnet = nodeSelectors.node(getState()).isTestnet
  const transfers = await getClient().payment.received(channel.get('address'))

  const pendingMessages = pendingMessagesSelectors.pendingMessages(getState())

  const msgs = await Promise.all(transfers.map(
    async (transfer) => {
      const message = await messages.transferToMessage(transfer, isTestnet)

      const pendingMessage = pendingMessages.find(
        pm => pm.txId && pm.txId === message.id)
      if (pendingMessage) {
        dispatch(
          pendingMessagesHandlers.actions.removeMessage(pendingMessage.opId)
        )
      }
      return message
    }
  ))

  dispatch(setMessages(msgs))
}

const loadChannel = (id) => async (dispatch, getState) => {
  dispatch(setChannelId(id))
  await dispatch(loadMessages())
}

const sendOnEnter = (event) => async (dispatch, getState) => {
  const enterPressed = event.nativeEvent.keyCode === 13
  const shiftPressed = event.nativeEvent.shiftKey === true
  if (enterPressed && !shiftPressed) {
    event.preventDefault()
    const message = messages.createMessage({
      identity: identitySelectors.data(getState()).toJS(),
      messageData: {
        type: messages.messageType.BASIC,
        data: event.target.value
      }
    })
    const channel = channelSelectors.data(getState()).toJS()
    const transfer = await messages.messageToTransfer({
      message,
      channel
    })
    try {
      const opId = await getClient().payment.send(transfer)
      await dispatch(pendingMessagesHandlers.epics.observeMessage({
        opId,
        channelId: channel.id,
        message
      }))
    } catch (err) {
      notificationsHandlers.actions.enqueueSnackbar(
        errorNotification({
          message: 'Couldn\'t send the message, please check node connection.'
        })
      )
    }
    dispatch(setMessage(''))
  }
}

const resendMessage = (message) => async (dispatch, getState) => {
  dispatch(pendingMessagesHandlers.actions.removeMessage(message.id))
  const channel = channelSelectors.data(getState()).toJS()
  const transfer = await messages.messageToTransfer({
    message,
    channel
  })
  try {
    const opId = await getClient().payment.send(transfer)
    await dispatch(pendingMessagesHandlers.epics.observeMessage({
      opId,
      channelId: channel.id,
      message
    }))
  } catch (err) {
    notificationsHandlers.actions.enqueueSnackbar(
      errorNotification({
        message: 'Couldn\'t send the message, please check node connection.'
      })
    )
  }
}

export const epics = {
  sendOnEnter,
  loadChannel,
  resendMessage,
  loadMessages
}

export const reducer = handleActions({
  [setSpentFilterValue]: (state, { payload: value }) => state.set('spentFilterValue', new BigNumber(value)),
  [setMessage]: (state, { payload: value }) => state.set('message', value),
  [setChannelId]: (state, { payload: id }) => state.set('id', id),
  [setMessages]: (state, { payload: messages }) => state.update(
    'messages',
    msgMeta => msgMeta
      .set('data', Immutable.fromJS(messages))
      .set('loading', false)
  )
}, initialState)

export default {
  reducer,
  epics,
  actions
}
