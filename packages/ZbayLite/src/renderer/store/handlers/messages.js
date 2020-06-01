import Immutable from 'immutable'
import BigNumber from 'bignumber.js'
import * as R from 'ramda'
import { createAction, handleActions } from 'redux-actions'
import { remote } from 'electron'

import selectors from '../selectors/messages'
import appSelectors from '../selectors/app'
import channelsSelectors from '../selectors/channels'
import channelSelectors from '../selectors/channel'
import usersSelectors from '../selectors/users'
import identitySelectors from '../selectors/identity'
import operationsSelectors from '../selectors/operations'
import operationsHandlers from './operations'
import channelsHandlers from './channels'
import { actions as channelActions } from './channel'
import txnTimestampsHandlers from '../handlers/txnTimestamps'
import txnTimestampsSelector from '../selectors/txnTimestamps'
import notificationCenterSelector from '../selectors/notificationCenter'
import appHandlers from './app'
import {
  messageType,
  actionTypes,
  notificationFilterType
} from '../../../shared/static'
import { messages as zbayMessages } from '../../zbay'
import { checkMessageSizeAfterComporession } from '../../zbay/transit'
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
    offerOwner: '',
    publicKey: null,
    blockTime: Number.MAX_SAFE_INTEGER
  },
  'ReceivedMessage'
)

const _RecivedFromUnknownMessage = Immutable.Record(
  {
    id: null,
    sender: MessageSender(),
    type: messageType.BASIC,
    message: '',
    spent: new BigNumber(0),
    createdAt: 0,
    specialType: null,
    blockTime: Number.MAX_SAFE_INTEGER
  },
  'RecivedFromUnknownMessage'
)

export const ReceivedMessage = values => {
  if (values.type === 'UNKNOWN') {
    delete values.payload.type
    const unknownRecord = _RecivedFromUnknownMessage({
      ...values.payload,
      type: new BigNumber(values.spent).gt(new BigNumber(0)) ? messageType.TRANSFER : messageType.BASIC,
      id: values.id,
      spent: new BigNumber(values.spent)
    })
    return unknownRecord
  }
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

const setMessages = createAction(actionTypes.SET_MESSAGES)
const cleanNewMessages = createAction(actionTypes.CLEAN_NEW_MESSAGESS)
const appendNewMessages = createAction(actionTypes.APPEND_NEW_MESSAGES)

export const actions = {
  setMessages,
  cleanNewMessages,
  appendNewMessages
}

export const fetchMessages = channel => async (dispatch, getState) => {
  try {
    const pendingMessages = operationsSelectors.pendingMessages(getState())
    const identityAddress = identitySelectors.address(getState())
    const currentChannel = channelSelectors.channel(getState())
    const users = usersSelectors.users(getState())
    let txnTimestamps = txnTimestampsSelector.tnxTimestamps(getState())

    if (pendingMessages.find(msg => msg.status === 'pending')) {
      return
    }
    const channelId = channel.get('id')
    const previousMessages = selectors.currentChannelMessages(channelId)(
      getState()
    )

    const transfers = await getClient().payment.received(channel.get('address'))

    if (
      transfers.length === appSelectors.transfers(getState()).get(channelId)
    ) {
      return
    } else {
      const oldTransfers = appSelectors.transfers(getState()).get(channelId) || 0
      dispatch(
        appHandlers.actions.reduceNewTransfersCount(
          transfers.length - oldTransfers
        )
      )
      dispatch(
        appHandlers.actions.setTransfers({
          id: channelId,
          value: transfers.length
        })
      )
    }
    for (const key in transfers) {
      const transfer = transfers[key]
      if (!txnTimestamps.get(transfer.txid)) {
        const result = await getClient().confirmations.getResult(transfer.txid)
        await getVault().transactionsTimestamps.addTransaction(
          transfer.txid,
          result.timereceived
        )
        await dispatch(
          txnTimestampsHandlers.actions.addTxnTimestamp({
            tnxs: { [transfer.txid]: result.timereceived.toString() }
          })
        )
      }
    }
    txnTimestamps = txnTimestampsSelector.tnxTimestamps(getState())
    const sortedTransfers = transfers.sort(
      (a, b) => txnTimestamps.get(a.txid) - txnTimestamps.get(b.txid)
    )
    const messagesAll = await Promise.all(
      sortedTransfers.map(async transfer => {
        const message = await zbayMessages.transferToMessage(transfer, users)
        if (message === null) {
          return ReceivedMessage(message)
        }
        const pendingMessage = pendingMessages.find(
          pm => pm.txId && pm.txId === message.id
        )
        if (pendingMessage) {
          dispatch(
            operationsHandlers.actions.removeOperation(pendingMessage.opId)
          )
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
    await messages.forEach(async msg => {
      if (msg.type === messageType.AD) {
        await getVault().adverts.addAdvert(msg)
      }
    })
    const updateChannelSettings = R.findLast(
      msg => msg.type === messageType.CHANNEL_SETTINGS_UPDATE
    )(messages)
    if (updateChannelSettings) {
      dispatch(
        channelsHandlers.epics.updateSettings({
          channelId,
          time: updateChannelSettings.createdAt,
          data: updateChannelSettings.message
        })
      )
    }
    await dispatch(setMessages({ messages, channelId }))
    if (currentChannel.address === channel.get('address')) {
      return
    }
    const newMessages = zbayMessages.calculateDiff({
      previousMessages,
      nextMessages: Immutable.List(messages),
      lastSeen,
      identityAddress
    })
    await dispatch(
      channelsHandlers.actions.setUnread({
        channelId,
        unread: newMessages.size
      })
    )
    await dispatch(
      appendNewMessages({
        channelId,
        messagesIds: newMessages.map(R.prop('id'))
      })
    )
    remote.app.badgeCount = remote.app.badgeCount + newMessages.size
    const filterType = notificationCenterSelector.channelFilterById(
      channel.get('address')
    )(getState())
    const userFilter = notificationCenterSelector.userFilterType(getState())
    const identity = identitySelectors.data(getState())
    const username = usersSelectors.registeredUser(identity.signerPubKey)(
      getState()
    )
    if (newMessages.size > 0) {
      if (
        userFilter === notificationFilterType.ALL_MESSAGES &&
        filterType === notificationFilterType.ALL_MESSAGES
      ) {
        newMessages.map(nm =>
          displayMessageNotification({ message: nm, channel })
        )
      }
      if (
        (userFilter === notificationFilterType.ALL_MESSAGES ||
          userFilter === notificationFilterType.MENTIONS) &&
        filterType === notificationFilterType.MENTIONS
      ) {
        newMessages
          .filter(msg => containsString(msg.message, `@${username}`))
          .map(nm => displayMessageNotification({ message: nm, channel }))
      }
    }
    return 1
  } catch (err) {
    console.warn(err)
  }
}

export const containsString = (message, nickname) => {
  if (typeof message === 'string') {
    const splitMessage = message.split(String.fromCharCode(160))
    if (splitMessage.includes(nickname)) {
      return true
    }
  }
  return false
}

export const _checkMessageSize = (mergedMessage) => async (dispatch, getState) => {
  if (!channelSelectors.isSizeCheckingInProgress(getState())) {
    dispatch(channelActions.isSizeCheckingInProgress(true))
  }
  const setStatus = (status) => {
    dispatch(channelActions.isSizeCheckingInProgress(false))
    dispatch(channelActions.messageSizeStatus(status))
  }
  if (mergedMessage) {
    const isMergedMessageTooLong = await checkMessageSizeAfterComporession(mergedMessage)
    return isMergedMessageTooLong
  } else {
    const message = channelSelectors.message(getState())
    const isMessageToLong = await checkMessageSizeAfterComporession(message)
    setStatus(isMessageToLong)
    return isMessageToLong
  }
}

export const checkMessageSize = (redirect) => {
  const thunk = _checkMessageSize(redirect)
  thunk.meta = {
    debounce: {
      time: 500,
      key: 'CHECK_MESSAGE_SIZE'
    }
  }
  return thunk
}

export const epics = {
  fetchMessages,
  checkMessageSize
}

export const reducer = handleActions(
  {
    [setMessages]: (state, { payload: { channelId, messages } }) =>
      state.update(channelId, ChannelMessages(), cm =>
        cm.set('messages', Immutable.fromJS(messages))
      ),
    [cleanNewMessages]: (state, { payload: { channelId } }) =>
      state.update(channelId, ChannelMessages(), cm =>
        cm.set('newMessages', Immutable.List())
      ),
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
