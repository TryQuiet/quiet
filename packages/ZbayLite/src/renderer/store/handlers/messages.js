import Immutable from 'immutable'
import BigNumber from 'bignumber.js'
import * as R from 'ramda'
import { createAction, handleActions } from 'redux-actions'

import selectors from '../selectors/messages'
import appSelectors from '../selectors/app'
import channelsSelectors from '../selectors/channels'
import usersSelectors from '../selectors/users'
import identitySelectors from '../selectors/identity'
import operationsSelectors from '../selectors/operations'
import operationsHandlers from './operations'
import channelsHandlers from './channels'
import txnTimestampsHandlers from '../handlers/txnTimestamps'
import txnTimestampsSelector from '../selectors/txnTimestamps'
import appHandlers from './app'
import { messageType } from '../../zbay/messages'
import { messages as zbayMessages } from '../../zbay'
import { getClient } from '../../zcash'
import { displayMessageNotification } from '../../notifications'
import { getVault } from '../../vault'

export const MessageSender = Immutable.Record(
  {
    replyTo: '',
    username: ''
  },
  'MessageSender'
)

const _ReceivedMessage = Immutable.Record(
  {
    id: null,
    type: messageType.BASIC,
    sender: MessageSender(),
    createdAt: 0,
    message: '',
    spent: new BigNumber(0),
    isUnregistered: false,
    tag: '',
    offerOwner: ''
  },
  'ReceivedMessage'
)

export const ReceivedMessage = values => {
  const record = _ReceivedMessage(values)
  return record.set('sender', MessageSender(record.sender))
}

export const ChannelMessages = Immutable.Record(
  {
    messages: Immutable.List(),
    newMessages: Immutable.List()
  },
  'ChannelMessages'
)

export const initialState = Immutable.Map()

const setMessages = createAction('SET_MESSAGES')
const cleanNewMessages = createAction('CLEAN_NEW_MESSAGESS')
const appendNewMessages = createAction('APPEND_NEW_MESSAGES')

export const actions = {
  setMessages,
  cleanNewMessages,
  appendNewMessages
}

export const fetchMessages = channel => async (dispatch, getState) => {
  try {
    const pendingMessages = operationsSelectors.pendingMessages(getState())
    const identityAddress = identitySelectors.address(getState())
    const users = usersSelectors.users(getState())
    const txnTimestamps = txnTimestampsSelector.tnxTimestamps(getState())

    if (pendingMessages.find(msg => msg.status === 'pending')) {
      return
    }
    const channelId = channel.get('id')
    const previousMessages = selectors.currentChannelMessages(channelId)(getState())

    const transfers = await getClient().payment.received(channel.get('address'))

    if (transfers.length === appSelectors.transfers(getState()).get(channelId)) {
      return
    } else {
      dispatch(appHandlers.actions.setTransfers({ id: channelId, value: transfers.length }))
    }
    await transfers.forEach(async transfer => {
      if (!txnTimestamps.get(transfer.txid)) {
        const result = await getClient().confirmations.getResult(transfer.txid)
        await getVault().transactionsTimestamps.addTransaction(transfer.txid, result.blocktime)
        await dispatch(
          txnTimestampsHandlers.actions.addTxnTimestamp({
            tnxs: { [transfer.txid]: result.blocktime.toString() }
          })
        )
      }
    })
    const sortedTransfers = transfers.sort(
      (a, b) => txnTimestamps.get(a.txid) - txnTimestamps.get(b.txid)
    )
    const messagesAll = await Promise.all(
      sortedTransfers.map(async transfer => {
        const message = await zbayMessages.transferToMessage(transfer, users)
        if (message === null) {
          return ReceivedMessage(message)
        }
        const pendingMessage = pendingMessages.find(pm => pm.txId && pm.txId === message.id)
        if (pendingMessage) {
          dispatch(operationsHandlers.actions.removeOperation(pendingMessage.opId))
        }
        return ReceivedMessage(message)
      })
    )
    const messages = messagesAll.filter(message => message.id !== null)
    let lastSeen = channelsSelectors.lastSeen(channelId)(getState())
    if (!lastSeen) {
      await dispatch(channelsHandlers.epics.updateLastSeen({ channelId }))
      lastSeen = channelsSelectors.lastSeen(channelId)(getState())
    }
    const newMessages = zbayMessages.calculateDiff({
      previousMessages,
      nextMessages: Immutable.List(messages),
      lastSeen,
      identityAddress
    })
    await dispatch(channelsHandlers.actions.setUnread({ channelId, unread: newMessages.size }))
    await dispatch(
      appendNewMessages({
        channelId,
        messagesIds: newMessages.map(R.prop('id'))
      })
    )
    await dispatch(setMessages({ messages, channelId }))
    newMessages.map(nm => displayMessageNotification({ message: nm, channel }))
  } catch (err) {
    console.warn(err)
  }
}

export const epics = {
  fetchMessages
}

export const reducer = handleActions(
  {
    [setMessages]: (state, { payload: { channelId, messages } }) =>
      state.update(channelId, ChannelMessages(), cm =>
        cm.set('messages', Immutable.fromJS(messages))
      ),
    [cleanNewMessages]: (state, { payload: { channelId } }) =>
      state.update(channelId, ChannelMessages(), cm => cm.set('newMessages', Immutable.List())),
    [appendNewMessages]: (state, { payload: { channelId, messagesIds } }) =>
      state.update(channelId, ChannelMessages(), cm =>
        cm.update('newMessages', nm => nm.concat(messagesIds))
      )
  },
  initialState
)

export default {
  reducer,
  epics,
  actions
}
