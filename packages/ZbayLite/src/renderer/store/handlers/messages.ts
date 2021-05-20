import Immutable from 'immutable'
import BigNumber from 'bignumber.js'
import * as R from 'ramda'
import fs from 'fs'
import { createAction } from 'redux-actions'

import appSelectors from '../selectors/app'
import channelSelectors from '../selectors/channel'
import usersSelectors from '../selectors/users'
import contactsSelectors from '../selectors/contacts'
import identitySelectors from '../selectors/identity'
import publicChannelsSelectors from '../selectors/publicChannels'
import { actions as channelActions } from './channel'
import contactsHandlers from './contacts'
import usersHandlers from './users'
import ratesHandlers from './rates'
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
import { DisplayableMessage } from '../../zbay/messages.types'
import channels from '../../zcash/channels'
import { displayMessageNotification } from '../../notifications'
import electronStore from '../../../shared/electronStore'
import notificationCenterSelectors from '../selectors/notificationCenter'
import staticChannelsMessages from '../../static/staticChannelsMessages.json'

export const messageSender = {
  replyTo: '',
  username: ''
}

export const _receivedMessage = {
  id: null,
  type: messageType.BASIC,
  sender: messageSender,
  createdAt: 0,
  message: '',
  spent: new BigNumber(0),
  isUnregistered: false,
  tag: '',
  offerOwner: '',
  publicKey: null,
  blockTime: Number.MAX_SAFE_INTEGER
}

const _receivedFromUnknownMessage = {
  id: null,
  sender: messageSender,
  type: messageType.BASIC,
  message: '',
  spent: new BigNumber(0),
  createdAt: 0,
  specialType: null,
  blockHeight: Number.MAX_SAFE_INTEGER
}

export const ReceivedMessage = values => {
  return {
    ..._receivedMessage,
    ...values
  }
}

export const ChannelMessages = {
  messages: [],
  newMessages: []
}

export const initialState = Immutable.Map()

export interface MessageStore {
  [key: string]: DisplayableMessage
}

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
  return `${curPrefix}${'0'.repeat(1024 - curPrefix.length)}`
}
// Generate Json file that contains transactions from default channels
export const createSnapshot = groupedMesssages => {
  const defaultChannels = Object.values(channels).map(ch => ch.mainnet.address)
  const data = {}
  for (const ch of defaultChannels) {
    data[ch] = groupedMesssages[ch]
  }
  fs.writeFileSync('staticChannelsMessages.json', JSON.stringify(data))
}

// TODO: remove
interface ITxn {
  address: string
  amount: number
  block_height: number
  memo: string
  memohex: string
}

export const fetchAllMessages = async (): Promise<{ [key in string]: any[] }> => {
  try {
    const txns: ITxn[] = await client.list()
    const txnsZec = txns
      .map(txn => ({
        ...txn,
        amount: txn.amount / satoshiMultiplier
      }))
      .filter(tx => tx.memo !== null || tx.memohex !== '')
      .sort((a, b) => a.block_height - b.block_height)
      .map(tx => (tx.memo && tx.memohex ? { ...tx, memohex: brokenMemoToMemohex(tx.memo) } : tx))
    return R.mergeDeepWith(
      R.concat,
      staticChannelsMessages,
      R.groupBy<ITxn>(txn => txn.address)(txnsZec)
    )
  } catch (err) {
    console.warn("Can't pull messages")
    console.warn(err)
    return {}
  }
}
export const fetchMessages = () => async (dispatch, getState) => {
  try {
    const txns = await fetchAllMessages()
    // Uncomment to create snapshot on next run.
    // createSnapshot(txns)
    const allMessagesTxnId = appSelectors.allTransactionsId(getState())
    for (const key in txns) {
      if (Object.prototype.hasOwnProperty.call(txns, key)) {
        txns[key] = txns[key].filter(tx => !allMessagesTxnId.has(tx.txid))
      }
    }
    const identityAddress = identitySelectors.address(getState())
    await dispatch(usersHandlers.epics.fetchUsers(txns[channels.registeredUsers.mainnet.address]))
    await dispatch(usersHandlers.epics.fetchOnionAddresses(txns[channels.tor.mainnet.address]))
    await dispatch(ratesHandlers.epics.fetchPrices(txns[channels.priceOracle.mainnet.address]))
    const importedChannels = electronStore.get('importedChannels')
    const publicChannels = publicChannelsSelectors.publicChannels(getState())
    const publicChannelAddresses = Object.values(publicChannels).map(el => el.address)

    // Ignore public channels from blockchain - they are taken from db now
    if (importedChannels) {
      const privateChannelsAddresses = Object.keys(importedChannels).filter((addr) => !publicChannelAddresses.includes(addr))
      if (privateChannelsAddresses) {
        for (const address of privateChannelsAddresses) {
          await dispatch(setChannelMessages(importedChannels[address], txns[address]))
        }
      }
    }

    await dispatch(setOutgoingTransactions(txns.undefined || []))
    dispatch(setUsersMessages(txns[identityAddress] || []))
    let allTransactionsId = allMessagesTxnId
    for (const key in txns) {
      if (key === 'undefined') {
        continue
      }
      if (Object.prototype.hasOwnProperty.call(txns, key)) {
        const mappedTxnIds = txns[key].map(tx => tx.txid)
        allTransactionsId = new Set([...Array.from(allTransactionsId.values()), ...mappedTxnIds])
      }
    }
    dispatch(appHandlers.actions.setAllTransactionsId(allTransactionsId))
    dispatch(appHandlers.actions.setInitialLoadFlag(true))
  } catch (err) {
    console.warn("Can't pull messages")
    console.warn(err)
    return {}
  }
}

export const checkTransferCount = (address, messages) => async (dispatch, getState) => {
  if (messages) {
    if (
      messages.length &&
      messages[messages.length - 1].memo === null &&
      messages[messages.length - 1].memohex === ''
    ) {
      // It will not save transaction count so next run will trigger refresh.
      console.log('skip wrong state')
      return 1
    }
    if (messages.length === appSelectors.transfers(getState())[address]) {
      return -1
    } else {
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
  console.log('entered find messages')
  if (messages) {
    console.log(`findNewMessagses: 1`)
    const currentChannel = channelSelectors.channel(state)
    if (key === currentChannel.id) {
      console.log(`findNewMessagses: 2`)
      return []
    }
    const userFilter = notificationCenterSelectors.userFilterType(state)
    const channelFilter = notificationCenterSelectors.channelFilterById(key)(state)
    const lastSeen = parseInt(electronStore.get(`lastSeen.${key}`)) || Number.MAX_SAFE_INTEGER
    console.log(`findNewMessagses: 3`)
    if (
      userFilter === notificationFilterType.NONE ||
      channelFilter === notificationFilterType.NONE
    ) {
      console.log(`findNewMessagses: 4`)
      return []
    }
    const signerPubKey = identitySelectors.signerPubKey(state)

    const filteredByTimeAndType = messages.filter(
      msg =>
        msg.publicKey !== signerPubKey &&
        msg.createdAt > lastSeen &&
        msgTypeToNotification.has(msg.type)
    )
    console.log(`findNewMessagses: 5 ${filteredByTimeAndType}`)
    if (
      isDM ||
      userFilter === notificationFilterType.MENTIONS ||
      channelFilter === notificationFilterType.MENTIONS
    ) {
      console.log('INSIDE ADDITIONAL IFS')
      const myUser = usersSelectors.myUser(state)
      return filteredByTimeAndType.filter(msg => {
        if (msg.message.itemId) {
          console.log(`First if: ${msg.message.itemId}`)
          console.log(`First if: ${msg.message.text}`)
          return msg.message.text
            ?.split(' ')
            .map(text => text.trim())
            .includes(`@${myUser.nickname}`)
        } else {
          console.log(`if else is ${msg.message}`)
          return msg.message
            ?.split(' ')
            .map(text => text.trim())
        }
      })
    }
    console.log(`findNewMessagses: 6 ${filteredByTimeAndType}`)
    return filteredByTimeAndType
  }
  return []
}

const setOutgoingTransactions = (messages: DisplayableMessage[]) => async (dispatch, getState) => {
  const users = usersSelectors.users(getState())

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
      const message = await zbayMessages.outgoingTransferToMessage(transfer, users)
      if (message === null) {
        return new DisplayableMessage(message)
      }
      return new DisplayableMessage(message)
    })
  )
  const contacts = contactsSelectors.contacts(getState())

  const itemMessages = messagesAll.filter(msg => (msg.message ? msg.message.itemId : null))
  const groupedItemMesssages = R.groupBy<DisplayableMessage>(
    msg => msg.message.itemId + msg.receiver.username
  )(itemMessages)
  for (const key in groupedItemMesssages) {
    if (key && groupedItemMesssages[key]) {
      const offer = contactsSelectors.getAdvertById(key.substring(0, 64))(getState())
      if (!offer) {
        continue
      }
      if (!contacts[key]) {
        await dispatch(
          contactsHandlers.actions.addContact({
            key: key,
            username: `${offer.message.tag} @${offer.sender.username}`,
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
  const normalMessages = messagesAll.filter(msg =>
    msg.message ? !msg.message.itemId && msg.receiver.publicKey : null
  )
  const groupedMesssages = R.groupBy<DisplayableMessage>(msg => msg.receiver.publicKey)(
    normalMessages
  )
  for (const key in groupedMesssages) {
    if (key && groupedMesssages[key]) {
      if (!contacts[key]) {
        const contact = users[key]
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
const setChannelMessages = (channel, messages = []) => async (dispatch, getState) => {
  const users = usersSelectors.users(getState())
  const filteredZbayMessages = messages.filter(msg => msg.memohex.startsWith('ff'))
  const messagesAll = await Promise.all(
    filteredZbayMessages.map(async transfer => {
      const message = await zbayMessages.transferToMessage(transfer, users)
      if (message === null) {
        return new DisplayableMessage(message)
      }
      return new DisplayableMessage(message)
    })
  )
  const contacts = contactsSelectors.contacts(getState())
  if (messagesAll.length === 0 && !contacts[channel.address]) {
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
        }, [])
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
const setUsersMessages = (messages: DisplayableMessage[]) => async (dispatch, getState) => {
  const filteredTextMessages = messages.filter(
    msg => !msg.memohex.startsWith('f6') && !msg.memohex.startsWith('ff')
  )
  const filteredZbayMessages = messages.filter(msg => msg.memohex.startsWith('ff'))
  const users = usersSelectors.users(getState())

  const parsedTextMessages = filteredTextMessages.map(msg => {
    return {
      ..._receivedFromUnknownMessage,
      id: msg.txid,
      type: new BigNumber(msg.amount).gt(new BigNumber(0))
        ? messageType.TRANSFER
        : messageType.BASIC,
      message: msg.memo || '',
      createdAt: msg.datetime,
      specialType: null,
      spent: new BigNumber(msg.amount),
      blockHeight: msg.block_height
    }
  })

  const unknownUser = {
    address: unknownUserId,
    nickname: 'Unknown'
  }
  if (parsedTextMessages.length > 0) {
    await dispatch(usersHandlers.actions.addUnknownUser())
    dispatch(
      contactsHandlers.actions.setMessages({
        key: unknownUserId,
        contactAddress: unknownUser.address,
        username: unknownUser.nickname,
        messages: parsedTextMessages.reduce((acc, cur) => {
          acc[cur.id] = cur
          return acc
        }, [])
      })
    )
  }
  const messagesAll = await Promise.all(
    filteredZbayMessages.map(async transfer => {
      const message = await zbayMessages.transferToMessage(transfer, users)
      if (message === null) {
        return new DisplayableMessage(message)
      }
      return new DisplayableMessage(message)
    })
  )
  const itemMessages = messagesAll.filter(msg => (msg.message ? msg.message.itemId : null))
  const contacts = contactsSelectors.contacts(getState())
  const groupedItemMesssages = R.groupBy<DisplayableMessage>(
    msg => msg.message.itemId + msg.sender.username
  )(itemMessages)
  for (const key in groupedItemMesssages) {
    if (key && groupedItemMesssages[key]) {
      const offer = contactsSelectors.getAdvertById(key.substring(0, 64))(getState())
      if (!offer) {
        continue
      }
      if (!contacts[key]) {
        await dispatch(
          contactsHandlers.actions.addContact({
            key: key,
            username: `${offer.message.tag} @${key.substring(64)}`,
            contactAddress: groupedItemMesssages[key][0].sender.replyTo,
            offerId: offer.id
          })
        )
      }
      const newMsgs = findNewMessages(key, groupedItemMesssages[key], getState(), true)
      newMsgs.forEach(msg => {
        displayMessageNotification({
          senderName: key.substring(64),
          message: msg.message.text,
          channelName: `${offer.message.tag} @${key.substring(64)}`
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
          message: groupedItemMesssages[key].reduce((acc, cur) => {
            acc[cur.id] = cur
            return acc
          }, {})
        })
      )
    }
  }
  const normalMessages = messagesAll.filter(msg => (msg.message ? !msg.message.itemId : null))
  const groupedMesssages = R.groupBy<DisplayableMessage>(msg => msg.publicKey)(normalMessages)
  for (const key in groupedMesssages) {
    if (groupedMesssages[key]) {
      const user = users[key]
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
          }, [])
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

export const _checkMessageSize = mergedMessage => async (dispatch, getState) => {
  if (!channelSelectors.isSizeCheckingInProgress(getState())) {
    dispatch(channelActions.isSizeCheckingInProgress(true))
  }
  const setStatus = status => {
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

export const epics = {
  fetchMessages
}

export default {
  epics,
  actions
}
