import Immutable from 'immutable'
import BigNumber from 'bignumber.js'
import * as R from 'ramda'
import { createAction, handleActions } from 'redux-actions'

import operationsHandlers, { operationTypes, PendingMessageOp } from './operations'
import notificationsHandlers from './notifications'
import channelSelectors from '../selectors/channel'
import identitySelectors from '../selectors/identity'
import nodeSelectors from '../selectors/node'
import operationsSelectors from '../selectors/operations'
import { getClient } from '../../zcash'
import { messages } from '../../zbay'
import { errorNotification, LoaderState } from './utils'
import { channelToUri } from '../../zbay/channels'

export const MessagesState = Immutable.Record({
  loader: LoaderState({ loading: true }),
  data: Immutable.List(),
  errors: ''
})

export const ChannelState = Immutable.Record({
  spentFilterValue: new BigNumber(0),
  id: null,
  message: '',
  shareableUri: '',
  messages: MessagesState(),
  members: null
}, 'ChannelState')

export const initialState = ChannelState()

const setSpentFilterValue = createAction('SET_SPENT_FILTER_VALUE', (_, value) => value)
const setMessage = createAction('SET_CHANNEL_MESSAGE', R.path(['target', 'value']))
const setChannelId = createAction('SET_CHANNEL_ID')
const setMessages = createAction('SET_CHANNEL_MESSAGES')
const setLoading = createAction('SET_CHANNEL_LOADING')
const setLoadingMessage = createAction('SET_CHANNEL_LOADING_MESSAGE')
const setShareableUri = createAction('SET_CHANNEL_SHAREABLE_URI')

export const actions = {
  setLoading,
  setLoadingMessage,
  setSpentFilterValue,
  setMessage,
  setShareableUri,
  setChannelId
}

const loadMessages = () => async (dispatch, getState) => {
  const channel = channelSelectors.data(getState())
  const isTestnet = nodeSelectors.node(getState()).isTestnet
  const transfers = await getClient().payment.received(channel.get('address'))

  const pendingMessages = operationsSelectors.pendingMessages(getState())

  const msgs = await Promise.all(transfers.map(
    async (transfer) => {
      const message = await messages.transferToMessage(transfer, isTestnet)

      const pendingMessage = pendingMessages.find(
        pm => pm.txId && pm.txId === message.id)
      if (pendingMessage) {
        dispatch(
          operationsHandlers.actions.removeOperation(pendingMessage.opId)
        )
      }
      return message
    }
  ))

  dispatch(setMessages(msgs))
}

const loadChannel = (id) => async (dispatch, getState) => {
  dispatch(setLoading(true))
  dispatch(setLoadingMessage('Loading messages'))
  try {
    dispatch(setChannelId(id))

    // Calculate URI on load, that way it won't be outdated, even if someone decides
    // to update channel in vault manually
    const channel = channelSelectors.data(getState())
    const uri = await channelToUri(channel.toJS())
    dispatch(setShareableUri(uri))

    await dispatch(loadMessages())
  } catch (err) {}
  dispatch(setLoading(false))
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
      await dispatch(operationsHandlers.epics.observeOperation({
        opId,
        type: operationTypes.pendingMessage,
        meta: PendingMessageOp({
          channelId: channel.id,
          message: Immutable.fromJS(message)
        })
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
  dispatch(operationsHandlers.actions.removeOperation(message.id))
  const channel = channelSelectors.data(getState()).toJS()
  const transfer = await messages.messageToTransfer({
    message,
    channel
  })
  try {
    const opId = await getClient().payment.send(transfer)
    await dispatch(operationsHandlers.epics.observeOperation({
      opId,
      type: operationTypes.pendingMessage,
      meta: PendingMessageOp({
        channelId: channel.id,
        message: Immutable.fromJS(message)
      })
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

// TODO: we should have a global loader map
export const reducer = handleActions({
  [setLoading]: (state, { payload: loading }) => state.setIn(['messages', 'loader', 'loading'], loading),
  [setLoadingMessage]: (state, { payload: message }) => state.setIn(['messages', 'loader', 'message'], message),
  [setSpentFilterValue]: (state, { payload: value }) => state.set('spentFilterValue', new BigNumber(value)),
  [setMessage]: (state, { payload: value }) => state.set('message', value),
  [setChannelId]: (state, { payload: id }) => state.set('id', id),
  [setShareableUri]: (state, { payload: uri }) => state.set('shareableUri', uri),
  [setMessages]: (state, { payload: messages }) => state.update(
    'messages',
    msgMeta => msgMeta
      .set('data', Immutable.fromJS(messages))
  )
}, initialState)

export default {
  reducer,
  epics,
  actions
}
