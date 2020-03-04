import Immutable from 'immutable'
import { DateTime } from 'luxon'
import { createAction, handleActions } from 'redux-actions'
import * as R from 'ramda'
import BigNumber from 'bignumber.js'
import { remote } from 'electron'
import history from '../../../shared/history'
import identitySelectors from '../selectors/identity'
import usersSelectors from '../selectors/users'
import appSelectors from '../selectors/app'
import offersSelectors from '../selectors/offers'
import messagesSelectors from '../selectors/messages'
import channelSelectors from '../selectors/channel'
import selectors, { Contact } from '../selectors/contacts'
import { directMessageChannel } from '../selectors/directMessageChannel'
import directMessagesQueue from '../selectors/directMessagesQueue'
import { messages as zbayMessages } from '../../zbay'
import { getClient } from '../../zcash'
import { getVault } from '../../vault'
import { displayDirectMessageNotification, offerNotification } from '../../notifications'
import operationsHandlers, { operationTypes, PendingDirectMessageOp } from './operations'
import { ReceivedMessage } from './messages'
import removedChannelsHandlers from './removedChannels'
import { messageType, actionTypes } from '../../../shared/static'

import directMessagesQueueHandlers, { checkConfirmationNumber } from './directMessagesQueue'
import channelHandlers from './channel'
import offersHandlers from './offers'
import appHandlers from './app'
import notificationsHandlers from './notifications'
import { errorNotification } from './utils'

const sendDirectMessageOnEnter = event => async (dispatch, getState) => {
  const enterPressed = event.nativeEvent.keyCode === 13
  const shiftPressed = event.nativeEvent.shiftKey === true
  const privKey = identitySelectors.signerPrivKey(getState())
  const dmQueue = directMessagesQueue.queue(getState())
  const channel = directMessageChannel(getState()).toJS()
  const messageToSend = channelSelectors.message(getState())
  const currentMessage = dmQueue.find(
    dm =>
      dm.get('recipientAddress') === channel.targetRecipientAddress &&
      dm.message.get('type') === messageType.BASIC
  )

  if (enterPressed && !shiftPressed) {
    event.preventDefault()

    let message
    if (currentMessage !== undefined) {
      message = zbayMessages.createMessage({
        messageData: {
          type: zbayMessages.messageType.BASIC,
          data: currentMessage.get('message').get('message') + '\n' + messageToSend
        },
        privKey
      })
    } else {
      message = zbayMessages.createMessage({
        messageData: {
          type: zbayMessages.messageType.BASIC,
          data: messageToSend
        },
        privKey
      })
    }
    dispatch(
      directMessagesQueueHandlers.epics.addDirectMessage({
        message,
        recipientAddress: channel.targetRecipientAddress,
        recipientUsername: channel.targetRecipientUsername
      })
    )
    dispatch(channelHandlers.actions.setMessage(''))
  }
}

const sendDirectMessage = payload => async (dispatch, getState) => {
  const { spent, type, message: messageData } = payload
  const privKey = identitySelectors.signerPrivKey(getState())
  const message = zbayMessages.createMessage({
    messageData: {
      type,
      data: messageData,
      spent:
        type === zbayMessages.messageType.TRANSFER ? new BigNumber(spent) : '0'
    },
    privKey
  })
  const { replyTo: recipientAddress, username: recipientUsername } = payload.receiver
  dispatch(
    directMessagesQueueHandlers.epics.addDirectMessage({
      message,
      recipientAddress,
      recipientUsername
    })
  )
}

const resendMessage = messageData => async (dispatch, getState) => {
  dispatch(operationsHandlers.actions.removeOperation(messageData.id))
  const identityAddress = identitySelectors.address(getState())
  const privKey = identitySelectors.signerPrivKey(getState())
  const message = zbayMessages.createMessage({
    messageData: {
      type: messageData.type,
      data: messageData.message,
      spent:
        messageData.type === zbayMessages.messageType.TRANSFER
          ? new BigNumber(messageData.spent)
          : '0'
    },
    privKey
  })
  const transfer = await zbayMessages.messageToTransfer({
    message,
    address: messageData.receiver.replyTo,
    amount: message.spent,
    identityAddress
  })
  try {
    const opId = await getClient().payment.send(transfer)
    await dispatch(
      operationsHandlers.epics.observeOperation({
        opId,
        type: operationTypes.pendingDirectMessage,
        meta: PendingDirectMessageOp({
          recipientAddress: messageData.receiver.replyTo,
          recipientUsername: messageData.receiver.username,
          message: Immutable.fromJS(message)
        }),
        checkConfirmationNumber
      })
    )
  } catch (err) {
    notificationsHandlers.actions.enqueueSnackbar(
      errorNotification({
        message: "Couldn't send the message, please check node connection."
      })
    )
  }
}

const initialState = Immutable.Map()

const setMessages = createAction(actionTypes.SET_DIRECT_MESSAGES)
const setVaultMessages = createAction(actionTypes.SET_VAULT_DIRECT_MESSAGES)
const cleanNewMessages = createAction(actionTypes.CLEAN_NEW_DIRECT_MESSAGESS)
const appendNewMessages = createAction(actionTypes.APPEND_NEW_DIRECT_MESSAGES)
const setLastSeen = createAction(actionTypes.SET_CONTACTS_LAST_SEEN)
const setUsernames = createAction(actionTypes.SET_CONTACTS_USERNAMES)
const removeContact = createAction(actionTypes.REMOVE_CONTACT)

export const actions = {
  setMessages,
  setVaultMessages,
  cleanNewMessages,
  appendNewMessages,
  setLastSeen,
  setUsernames,
  removeContact
}
export const loadContact = address => async (dispatch, getState) => {
  const contact = selectors.contact(address)(getState())
  dispatch(updateLastSeen({ contact }))
}
export const linkUserRedirect = contact => async (dispatch, getState) => {
  const contacts = selectors.contacts(getState())
  if (contacts.get(contact.address)) {
    history.push(`/main/direct-messages/${contact.address}/${contact.nickname}`)
  }
  const identityId = identitySelectors.id(getState())
  await getVault().contacts.listMessages({
    identityId,
    recipientUsername: contact.nickname,
    recipientAddress: contact.address
  })
  await dispatch(
    setUsernames({
      sender: {
        replyTo: contact.address,
        username: contact.nickname
      }
    })
  )
  dispatch(
    loadVaultMessages({
      contact: {
        username: contact.nickname,
        replyTo: contact.address
      }
    })
  )
  history.push(`/main/direct-messages/${contact.address}/${contact.nickname}`)
}
export const fetchMessages = () => async (dispatch, getState) => {
  try {
    const identityAddress = identitySelectors.address(getState())
    const transfers = await getClient().payment.received(identityAddress)
    if (transfers.length === appSelectors.transfers(getState()).get(identityAddress)) {
      return
    } else {
      dispatch(appHandlers.actions.setTransfers({ id: identityAddress, value: transfers.length }))
    }

    const users = usersSelectors.users(getState())
    const messagesAll = await Promise.all(
      transfers
        .map(async transfer => {
          const message = await zbayMessages.transferToMessage(transfer, users)

          return message && ReceivedMessage(message)
        })
        .filter(msg => msg !== null)
    )
    const messages = messagesAll
      .filter(msg => msg !== null)
      .filter(msg => msg.sender.replyTo !== '')
      .filter(msg => msg.type !== messageType.ITEM_BASIC && msg.type !== messageType.ITEM_TRANSFER)

    await messages.forEach(async msg => {
      if (msg.type === messageType.AD) {
        await getVault().adverts.addAdvert(msg)
      }
    })
    const messagesOffers = messagesAll
      .filter(msg => msg !== null)
      .filter(msg => msg.sender.replyTo !== '')
      .filter(msg => msg.type === messageType.ITEM_BASIC || msg.type === messageType.ITEM_TRANSFER)

    await messagesOffers.forEach(async msg => {
      let offer = offersSelectors.offers(getState()).find(
        off =>
          off.itemId.substring(0, 64) === msg.message.itemId && off.address === msg.sender.replyTo // TODO find better solution when user changes nickname
      )
      if (msg.message.itemId === null || msg.message.itemId === undefined) {
        return
      }
      if (!offer) {
        const ad = messagesSelectors.messageById(msg.message.itemId)(getState())
        const payload = {
          tag: ad.message.tag,
          offerOwner: msg.sender.username,
          id: msg.message.itemId,
          address: msg.sender.replyTo
        }
        await dispatch(offersHandlers.epics.createOffer({ payload }))
      }
      offer = offersSelectors
        .offers(getState())
        .find(
          off =>
            off.itemId.substring(0, 64) === msg.message.itemId && off.address === msg.sender.replyTo
        )
      if (!offer.messages.find(message => message.id === msg.id)) {
        await dispatch(
          offersHandlers.actions.appendMessages({
            message: msg
              .merge({ message: msg.message.text })
              .set('tag', msg.message.tag)
              .set('offerOwner', msg.message.offerOwner),
            itemId: offer.itemId
          })
        )
        const lastSeen = offersSelectors.lastSeen(offer.itemId)(getState())
        if (DateTime.fromSeconds(msg.createdAt) > lastSeen) {
          await dispatch(
            offersHandlers.actions.appendNewMessages({
              message: msg.id,
              itemId: offer.itemId
            })
          )
          remote.app.badgeCount = remote.app.badgeCount + 1
          offerNotification({
            message: msg.message.text,
            username: msg.sender.username
          })
        }
      }
    })
    const senderToMessages = R.compose(
      R.groupBy(msg => msg.sender.replyTo),
      R.filter(R.identity)
    )(messages)
    const identityId = identitySelectors.id(getState())
    await Promise.all(
      Object.entries(senderToMessages).map(async ([contactAddress, contactMessages]) => {
        const contact = contactMessages[0].sender
        const [newestMsg] = contactMessages.sort((a, b) => b.createdAt - a.createdAt)
        const { createdAt: contactMsgTimestamp } = newestMsg
        const removedChannels = await getVault().disabledChannels.listRemovedChannels()
        const removedTimeStamp = removedChannels[contactAddress]
        if (removedTimeStamp && parseInt(removedTimeStamp) > contactMsgTimestamp) {
          return
        }
        await dispatch(setUsernames({ sender: newestMsg.sender }))
        await dispatch(loadVaultMessages({ contact }))
        const previousMessages = selectors.messages(contactAddress)(getState())
        let lastSeen = selectors.lastSeen(contactAddress)(getState())
        if (!lastSeen) {
          lastSeen = await getVault().contacts.getLastSeen({
            identityId,
            recipientAddress: contactAddress,
            recipientUsername: newestMsg.sender
          })
        }
        const newMessages = zbayMessages.calculateDiff({
          previousMessages,
          nextMessages: Immutable.List(contactMessages),
          lastSeen,
          identityAddress
        })
        dispatch(
          appendNewMessages({
            contactAddress,
            messagesIds: newMessages.map(R.prop('id'))
          })
        )
        dispatch(setMessages({ messages: contactMessages, contactAddress }))
        remote.app.badgeCount = remote.app.badgeCount + newMessages.size
        newMessages.map(nm => {
          const notification = displayDirectMessageNotification({
            message: nm,
            username: contact.username
          })
          notification.onclick = () => {
            history.push(`/main/direct-messages/${contact.replyTo}/${contact.username}`)
          }
        })
      })
    )
  } catch (err) {
    console.warn(err)
  }
}

export const updateLastSeen = ({ contact }) => async (dispatch, getState) => {
  const identityId = identitySelectors.id(getState())
  const lastSeen = DateTime.utc()
  const unread = selectors.newMessages(contact.address)(getState()).size
  remote.app.badgeCount = remote.app.badgeCount - unread
  cleanNewMessages({ contactAddress: contact.address })
  await getVault().contacts.updateLastSeen({
    identityId,
    recipientUsername: contact.username,
    recipientAddress: contact.replyTo || contact.address,
    lastSeen
  })
  dispatch(
    setLastSeen({
      lastSeen,
      contact
    })
  )
}

export const loadVaultMessages = ({ contact }) => async (dispatch, getState) => {
  const identityId = identitySelectors.id(getState())
  const identityAddress = identitySelectors.address(getState())
  const { messages: vaultMessages } = await getVault().contacts.listMessages({
    identityId,
    recipientUsername: contact.username,
    recipientAddress: contact.replyTo
  })
  const vaultMessagesToDisplay = vaultMessages
    .filter(m => m.type !== messageType.ITEM_BASIC && m.type !== messageType.ITEM_TRANSFER)
    .map(msg =>
      zbayMessages.vaultToDisplayableMessage({
        message: msg,
        identityAddress,
        receiver: { replyTo: contact.replyTo, username: contact.username }
      })
    )
  dispatch(
    setVaultMessages({
      contactAddress: contact.replyTo,
      vaultMessagesToDisplay
    })
  )
}

export const createVaultContact = ({ contact, history }) => async (dispatch, getState) => {
  const identityId = identitySelectors.id(getState())
  await getVault().contacts.listMessages({
    identityId,
    recipientUsername: contact.username,
    recipientAddress: contact.replyTo
  })
  await dispatch(
    setUsernames({
      sender: {
        replyTo: contact.replyTo,
        username: contact.username
      }
    })
  )
  history.push(`/main/direct-messages/${contact.replyTo}/${contact.username}`)
}

export const createVaultContactOffer = ({ contact, history }) => async (dispatch, getState) => {
  const identityId = identitySelectors.id(getState())
  await getVault().contacts.listMessages({
    identityId,
    recipientUsername: contact.username,
    recipientAddress: contact.replyTo
  })
  await dispatch(
    setUsernames({
      sender: {
        replyTo: contact.replyTo,
        username: contact.username
      }
    })
  )
  history.push(`/main/offers/${contact.replyTo}/${contact.username}`)
}

export const loadAllSentMessages = () => async (dispatch, getState) => {
  const identityId = identitySelectors.id(getState())
  const identityAddress = identitySelectors.address(getState())
  const allMessages = await getVault().contacts.loadAllSentMessages({ identityId })
  const removedChannels = await getVault().disabledChannels.listRemovedChannels()
  allMessages.forEach(async contact => {
    const [newestMsg] = contact.messages.sort((a, b) => b.createdAt - a.createdAt)
    const removedTimeStamp = removedChannels[contact.address]
    if (!newestMsg && removedTimeStamp) {
      return
    }
    if (newestMsg) {
      const { createdAt: contactMsgTimestamp } = newestMsg
      if (removedTimeStamp && parseInt(removedTimeStamp) > contactMsgTimestamp) {
        return
      }
    }
    for (const txn of contact.messages) {
      if (txn.status === 'pending' || txn.status === 'success') {
        try {
          const tx = await getClient().confirmations.getResult(txn.id)
          if (tx.confirmations >= 1) {
            txn.status = 'broadcasted'
            await getVault().contacts.updateMessage({
              identityId: identityId,
              messageId: txn.id,
              recipientAddress: contact.address,
              recipientUsername: contact.username,
              newMessageStatus: 'broadcasted'
            })
          }
        } catch (error) {
          await getVault().contacts.updateMessage({
            identityId: identityId,
            messageId: txn.id,
            recipientAddress: contact.address,
            recipientUsername: contact.username,
            newMessageStatus: 'failed'
          })
        }
      }
    }
    const vaultMessagesToDisplay = contact.messages.map(msg =>
      zbayMessages.vaultToDisplayableMessage({
        message: msg,
        identityAddress,
        receiver: { replyTo: contact.address, username: contact.username }
      })
    )
    dispatch(
      setVaultMessages({
        contactAddress: contact.address,
        vaultMessagesToDisplay
      })
    )
    const lastSeen = await getVault().contacts.getLastSeen({
      identityId,
      recipientAddress: contact.address,
      recipientUsername: contact.username
    })
    await dispatch(
      setLastSeen({
        lastSeen,
        contact: {
          replyTo: contact.address
        }
      })
    )
    await dispatch(
      setUsernames({
        sender: {
          replyTo: contact.address,
          username: contact.username ? contact.username : contact.address.substring(0, 10)
        }
      })
    )
  })
}

export const updateDeletedChannelTimestamp = ({ address, timestamp }) => async (
  dispatch,
  getState
) => {
  await getVault().disabledChannels.addToRemoved(address, timestamp)
  await dispatch(removedChannelsHandlers.epics.getRemovedChannelsTimestamp())
}

export const deleteChannel = ({ address, timestamp, history }) => async (dispatch, getState) => {
  history.push(`/main/channel/general`)
  await getVault().disabledChannels.addToRemoved(address, timestamp)
  await dispatch(removedChannelsHandlers.epics.getRemovedChannelsTimestamp())
  dispatch(removeContact(address))
}

export const epics = {
  fetchMessages,
  updateLastSeen,
  sendDirectMessage,
  loadVaultMessages,
  sendDirectMessageOnEnter,
  loadAllSentMessages,
  resendMessage,
  loadContact,
  createVaultContact,
  updateDeletedChannelTimestamp,
  deleteChannel,
  linkUserRedirect
}

export const reducer = handleActions(
  {
    [setMessages]: (state, { payload: { contactAddress, messages } }) =>
      state.update(contactAddress, Contact(), cm => cm.set('messages', Immutable.fromJS(messages))),
    [setVaultMessages]: (state, { payload: { contactAddress, vaultMessagesToDisplay } }) =>
      state.update(contactAddress, Contact(), cm =>
        cm.set('vaultMessages', Immutable.fromJS(vaultMessagesToDisplay))
      ),
    [cleanNewMessages]: (state, { payload: { contactAddress } }) => {
      const newState = state.update(contactAddress, Contact(), cm =>
        cm.set('newMessages', Immutable.List())
      )
      return newState
    },
    [appendNewMessages]: (state, { payload: { contactAddress, messagesIds } }) =>
      state.update(contactAddress, Contact(), cm =>
        cm.update('newMessages', nm => nm.concat(messagesIds))
      ),
    [setLastSeen]: (state, { payload: { lastSeen, contact } }) =>
      state.update(contact.replyTo || contact.address, Contact(), cm =>
        cm.set('lastSeen', lastSeen)
      ),
    [removeContact]: (state, { payload: address }) => state.delete(address),
    [setUsernames]: (state, { payload: { sender } }) =>
      state.update(sender.replyTo, Contact(), cm =>
        cm.set('username', sender.username).set('address', sender.replyTo)
      )
  },
  initialState
)

export default {
  epics,
  actions,
  reducer
}
