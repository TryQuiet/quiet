import Immutable from 'immutable'
import BigNumber from 'bignumber.js'
import * as R from 'ramda'
import { createAction, handleActions } from 'redux-actions'
// import { remote } from 'electron'

import appSelectors from '../selectors/app'
import channelSelectors from '../selectors/channel'
import usersSelectors from '../selectors/users'
import contactsSelectors from '../selectors/contacts'
import identitySelectors from '../selectors/identity'
import { actions as channelActions } from './channel'
import contactsHandlers from '../handlers/contacts'
import usersHandlers from './users'
import ratesHandlers from './rates'
import publicChannelsHandlers from './publicChannels'
import appHandlers from './app'
import {
  messageType,
  actionTypes,
  unknownUserId,
  satoshiMultiplier,
  notificationFilterType
} from '../../../shared/static'
import { messages as zbayMessages } from '../../zbay'
import { checkMessageSizeAfterComporession } from '../../zbay/transit'
import client from '../../zcash'
import { DisplayableMessage } from '../../zbay/messages'
import channels from '../../zcash/channels'
import { displayMessageNotification } from '../../notifications'
import electronStore from '../../../shared/electronStore'
import notificationCenterSelectors from '../selectors/notificationCenter'
import staticChannelsMessages from '../../static/staticChannelsMessages.json'

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
    blockHeight: Number.MAX_SAFE_INTEGER
  },
  'RecivedFromUnknownMessage'
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

const setMessages = createAction(actionTypes.SET_MESSAGES)
const cleanNewMessages = createAction(actionTypes.CLEAN_NEW_MESSAGESS)
const appendNewMessages = createAction(actionTypes.APPEND_NEW_MESSAGES)

export const actions = {
  setMessages,
  cleanNewMessages,
  appendNewMessages
}
export const brokenMemoToMemohex = memo => {
  const curPrefix = memo.substring(2)
  return curPrefix + '0'.repeat(1024 - curPrefix.length)
}
export const fetchAllMessages = async () => {
  try {
    const txns = await client.list()
    const txnsZec = txns
      .map(txn => ({
        ...txn,
        amount: txn.amount / satoshiMultiplier
      }))
      .sort((a, b) => a.block_height - b.block_height)
      .map(tx =>
        tx.memo && tx.memohex
          ? { ...tx, memohex: brokenMemoToMemohex(tx.memo) }
          : tx
      )
    return R.mergeDeepWith(
      R.concat,
      staticChannelsMessages,
      R.groupBy(txn => txn.address)(txnsZec)
    )
  } catch (err) {
    console.warn(`Can't pull messages`)
    console.warn(err)
    return {}
  }
}
export const fetchMessages = () => async (dispatch, getState) => {
  try {
    const txns = await fetchAllMessages()
    const identityAddress = identitySelectors.address(getState())
    await dispatch(
      usersHandlers.epics.fetchUsers(
        channels.registeredUsers.mainnet.address,
        txns[channels.registeredUsers.mainnet.address]
      )
    )
    await dispatch(
      ratesHandlers.epics.fetchPrices(
        channels.priceOracle.mainnet.address,
        txns[channels.priceOracle.mainnet.address]
      )
    )
    await dispatch(
      publicChannelsHandlers.epics.fetchPublicChannels(
        channels.channelOfChannels.mainnet,
        txns[channels.channelOfChannels.mainnet.address]
      )
    )
    const importedChannels = electronStore.get(`importedChannels`)
    if (importedChannels) {
      for (const address of Object.keys(importedChannels)) {
        await dispatch(
          setChannelMessages(importedChannels[address], txns[address])
        )
      }
    }
    await dispatch(
      setChannelMessages(
        channels.general.mainnet,
        txns[channels.general.mainnet.address]
      )
    )
    await dispatch(
      setChannelMessages(
        channels.store.mainnet,
        txns[channels.store.mainnet.address]
      )
    )
    await dispatch(setOutgoingTransactions(identityAddress, txns['undefined']))
    dispatch(setUsersMessages(identityAddress, txns[identityAddress]))
    dispatch(appHandlers.actions.setInitialLoadFlag(true))
  } catch (err) {
    console.warn(`Can't pull messages`)
    console.warn(err)
    return {}
  }
}
export const checkTransferCount = (address, messages) => async (
  dispatch,
  getState
) => {
  if (messages) {
    if (
      messages.length &&
      messages[messages.length - 1].memo === null &&
      messages[messages.length - 1].memohex === ''
    ) {
      console.log('skip wrong state')
      return -1
    }
    if (messages.length === appSelectors.transfers(getState()).get(address)) {
      return -1
    } else {
      // const oldTransfers = appSelectors.transfers(getState()).get(address) || 0
      // dispatch(
      //   appHandlers.actions.reduceNewTransfersCount(
      //     messages.length - oldTransfers
      //   )
      // )
      dispatch(
        appHandlers.actions.setTransfers({
          id: address,
          value: messages.length
        })
      )
    }
  }
}
const msgTypeToNotification = new Set([
  messageType.BASIC,
  messageType.ITEM_TRANSFER,
  messageType.ITEM_BASIC,
  messageType.TRANSFER
])

export const findNewMessages = (key, messages, state, isDM = false) => {
  if (messages) {
    const currentChannel = channelSelectors.channel(state)
    if (key === currentChannel.address) {
      return []
    }
    const userFilter = notificationCenterSelectors.userFilterType(state)
    const channelFilter = notificationCenterSelectors.channelFilterById(key)(
      state
    )
    const lastSeen =
      parseInt(electronStore.get(`lastSeen.${key}`)) || Number.MAX_SAFE_INTEGER
    if (
      userFilter === notificationFilterType.NONE ||
      channelFilter === notificationFilterType.NONE
    ) {
      return []
    }
    const signerPubKey = identitySelectors.signerPubKey(state)

    const filteredByTimeAndType = messages.filter(
      msg =>
        msg.publicKey !== signerPubKey &&
        msg.createdAt > lastSeen &&
        msgTypeToNotification.has(msg.type)
    )
    if (
      isDM ||
      userFilter === notificationFilterType.MENTIONS ||
      channelFilter === notificationFilterType.MENTIONS
    ) {
      const myUser = usersSelectors.myUser(state)
      return filteredByTimeAndType.filter(msg => {
        if (msg.message.itemId) {
          return (
            msg.message.text &&
            msg.message.text
              .split(' ')
              .map(text => text.trim())
              .includes(`@${myUser.nickname}`)
          )
        } else {
          return (
            msg.message &&
            msg.message
              .split(' ')
              .map(text => text.trim())
              .includes(`@${myUser.nickname}`)
          )
        }
      })
    }
    return filteredByTimeAndType
  }
  return []
}

const setOutgoingTransactions = (address, messages) => async (
  dispatch,
  getState
) => {
  const users = usersSelectors.users(getState())

  const transferCountFlag = await dispatch(
    checkTransferCount('outgoing', messages)
  )
  if (transferCountFlag === -1 || !messages) {
    return
  }
  const filteredOutgoingMessages = messages.filter(msg => {
    if (!msg.outgoing_metadata.length) {
      return false
    }
    if (msg.outgoing_metadata[0].memo) {
      return msg.outgoing_metadata[0].memo.substring(2).startsWith('ff')
    }
    if (msg.outgoing_metadata[0].memohex) {
      return msg.outgoing_metadata[0].memohex.startsWith('ff')
    }
    return false
  })
  const messagesAll = await Promise.all(
    filteredOutgoingMessages.map(async transfer => {
      const message = await zbayMessages.outgoingTransferToMessage(
        transfer,
        users
      )
      if (message === null) {
        return DisplayableMessage(message)
      }
      return DisplayableMessage(message)
    })
  )
  const contacts = contactsSelectors.contacts(getState())

  const itemMessages = messagesAll.filter(msg => msg.message.itemId)
  const groupedItemMesssages = R.groupBy(
    msg => msg.message.itemId + msg.receiver.username
  )(itemMessages)
  for (const key in groupedItemMesssages) {
    if (key && groupedItemMesssages.hasOwnProperty(key)) {
      const offer = contactsSelectors.getAdvertById(key.substring(0, 64))(
        getState()
      )
      if (!offer) {
        continue
      }
      if (!contacts.get(key)) {
        await dispatch(
          contactsHandlers.actions.addContact({
            key: key,
            username: offer.message.tag + ' @' + offer.sender.username,
            contactAddress: offer.sender.replyTo,
            offerId: offer.id
          })
        )
      }
      dispatch(
        contactsHandlers.actions.addMessage({
          key: key,
          message: groupedItemMesssages[key].reduce(
            (acc, cur) => {
              acc[cur.id] = cur
              return acc
            },
            { [offer.id]: offer }
          )
        })
      )
    }
  }
  const normalMessages = messagesAll.filter(
    msg => !msg.message.itemId && msg.receiver.publicKey
  )
  const groupedMesssages = R.groupBy(msg => msg.receiver.publicKey)(
    normalMessages
  )
  for (const key in groupedMesssages) {
    if (key && groupedMesssages.hasOwnProperty(key)) {
      if (!contacts.get(key)) {
        const contact = users.get(key)
        await dispatch(
          contactsHandlers.actions.addContact({
            key: contact.publicKey,
            username: contact.nickname,
            contactAddress: contact.address
          })
        )
      }
      dispatch(
        contactsHandlers.actions.addMessage({
          key: key,
          message: groupedMesssages[key].reduce((acc, cur) => {
            acc[cur.id] = cur
            return acc
          }, {})
        })
      )
    }
  }
}
const setChannelMessages = (channel, messages = []) => async (
  dispatch,
  getState
) => {
  const users = usersSelectors.users(getState())

  const transferCountFlag = await dispatch(
    checkTransferCount(channel.address, messages)
  )
  if (transferCountFlag === -1 || !messages) {
    return
  }
  const filteredZbayMessages = messages.filter(msg =>
    msg.memohex.startsWith('ff')
  )
  const messagesAll = await Promise.all(
    filteredZbayMessages.map(async transfer => {
      const message = await zbayMessages.transferToMessage(transfer, users)
      if (message === null) {
        return DisplayableMessage(message)
      }
      // const pendingMessage = pendingMessages.find(
      //   pm => pm.txId && pm.txId === message.id
      // )
      // if (pendingMessage) {
      //   dispatch(
      //     operationsHandlers.actions.removeOperation(pendingMessage.opId)
      //   )
      // }
      return DisplayableMessage(message)
    })
  )
  const contacts = contactsSelectors.contacts(getState())
  if (messagesAll.length === 0 && !contacts.get(channel.address)) {
    dispatch(
      contactsHandlers.actions.addContact({
        key: channel.address,
        contactAddress: channel.address,
        username: channel.name
      })
    )
    return
  }
  dispatch(
    contactsHandlers.actions.setMessages({
      key: channel.address,
      contactAddress: channel.address,
      username: channel.name,
      messages: messagesAll
        .filter(msg => msg.id !== null)
        .reduce((acc, cur) => {
          acc[cur.id] = cur
          return acc
        }, {})
    })
  )
  const newMsgs = findNewMessages(channel.address, messagesAll, getState())
  newMsgs.forEach(msg => {
    displayMessageNotification({
      senderName: msg.sender.username,
      message: msg.message,
      channelName: channel.name
    })
  })
  dispatch(
    contactsHandlers.actions.appendNewMessages({
      contactAddress: channel.address,
      messagesIds: newMsgs
    })
  )
}
const setUsersMessages = (address, messages) => async (dispatch, getState) => {
  const users = usersSelectors.users(getState())
  const transferCountFlag = await dispatch(
    checkTransferCount(address, messages)
  )
  if (transferCountFlag === -1 || !messages) {
    console.log('skip')

    return
  }
  const filteredTextMessages = messages.filter(
    msg => !msg.memohex.startsWith('f6') && !msg.memohex.startsWith('ff')
  )
  const filteredZbayMessages = messages.filter(msg =>
    msg.memohex.startsWith('ff')
  )
  const parsedTextMessages = filteredTextMessages.map(msg => {
    return _RecivedFromUnknownMessage({
      id: msg.txid,
      sender: MessageSender(),
      type: new BigNumber(msg.amount).gt(new BigNumber(0))
        ? messageType.TRANSFER
        : messageType.BASIC,
      message: msg.memo || '',
      createdAt: msg.datetime,
      specialType: null,
      spent: new BigNumber(msg.amount),
      blockHeight: msg.block_height
    })
  })
  const unknownUser = users.get(unknownUserId)
  dispatch(
    contactsHandlers.actions.setMessages({
      key: unknownUserId,
      contactAddress: unknownUser.address,
      username: unknownUser.nickname,
      messages: parsedTextMessages.reduce((acc, cur) => {
        acc[cur.id] = cur
        return acc
      }, {})
    })
  )
  const messagesAll = await Promise.all(
    filteredZbayMessages.map(async transfer => {
      const message = await zbayMessages.transferToMessage(transfer, users)
      if (message === null) {
        return DisplayableMessage(message)
      }
      // const pendingMessage = pendingMessages.find(
      //   pm => pm.txId && pm.txId === message.id
      // )
      // if (pendingMessage) {
      //   dispatch(
      //     operationsHandlers.actions.removeOperation(pendingMessage.opId)
      //   )
      // }
      return DisplayableMessage(message)
    })
  )
  const itemMessages = messagesAll.filter(msg => msg.message.itemId)
  const contacts = contactsSelectors.contacts(getState())
  const groupedItemMesssages = R.groupBy(
    msg => msg.message.itemId + msg.sender.username
  )(itemMessages)
  for (const key in groupedItemMesssages) {
    if (key && groupedItemMesssages.hasOwnProperty(key)) {
      const offer = contactsSelectors.getAdvertById(key.substring(0, 64))(
        getState()
      )
      if (!offer) {
        continue
      }
      if (!contacts.get(key)) {
        await dispatch(
          contactsHandlers.actions.addContact({
            key: key,
            username: offer.message.tag + ' @' + key.substring(64),
            contactAddress: groupedItemMesssages[key][0].sender.replyTo,
            offerId: offer.id
          })
        )
      }
      const newMsgs = findNewMessages(
        key,
        groupedItemMesssages[key],
        getState(),
        true
      )
      newMsgs.forEach(msg => {
        displayMessageNotification({
          senderName: key.substring(64),
          message: msg.message.text,
          channelName: offer.message.tag + ' @' + key.substring(64)
        })
      })
      dispatch(
        contactsHandlers.actions.appendNewMessages({
          contactAddress: key,
          messagesIds: newMsgs
        })
      )

      dispatch(
        contactsHandlers.actions.addMessage({
          key: key,
          message: groupedItemMesssages[key].reduce(
            (acc, cur) => {
              acc[cur.id] = cur
              return acc
            },
            { [offer.id]: offer }
          )
        })
      )
    }
  }
  const normalMessages = messagesAll.filter(msg => !msg.message.itemId)
  const groupedMesssages = R.groupBy(msg => msg.publicKey)(normalMessages)
  for (const key in groupedMesssages) {
    if (groupedMesssages.hasOwnProperty(key)) {
      const user = users.get(key)
      // filter unregistered users
      if (!user) {
        continue
      }
      dispatch(
        contactsHandlers.actions.setMessages({
          key: key,
          contactAddress: user.address || key,
          username: user.nickname || key,
          messages: groupedMesssages[key].reduce((acc, cur) => {
            acc[cur.id] = cur
            return acc
          }, {})
        })
      )
      const newMsgs = findNewMessages(key, groupedMesssages[key], getState())
      newMsgs.forEach(msg => {
        displayMessageNotification({
          senderName: user.nickname || key,
          message: msg.message,
          channelName: user.nickname || key
        })
      })
      dispatch(
        contactsHandlers.actions.appendNewMessages({
          contactAddress: key,
          messagesIds: newMsgs
        })
      )
    }
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

export const _checkMessageSize = mergedMessage => async (
  dispatch,
  getState
) => {
  if (!channelSelectors.isSizeCheckingInProgress(getState())) {
    dispatch(channelActions.isSizeCheckingInProgress(true))
  }
  const setStatus = status => {
    dispatch(channelActions.isSizeCheckingInProgress(false))
    dispatch(channelActions.messageSizeStatus(status))
  }
  if (mergedMessage) {
    const isMergedMessageTooLong = await checkMessageSizeAfterComporession(
      mergedMessage
    )
    return isMergedMessageTooLong
  } else {
    const message = channelSelectors.message(getState())
    const isMessageToLong = await checkMessageSizeAfterComporession(message)
    setStatus(isMessageToLong)
    return isMessageToLong
  }
}

export const checkMessageSize = redirect => {
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
