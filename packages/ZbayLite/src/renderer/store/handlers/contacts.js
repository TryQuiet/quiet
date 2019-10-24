import Immutable from 'immutable'
import { DateTime } from 'luxon'
import { createAction, handleActions } from 'redux-actions'
import * as R from 'ramda'
import BigNumber from 'bignumber.js'
import history from '../../../shared/history'
import identitySelectors from '../selectors/identity'
import usersSelectors from '../selectors/users'
import appSelectors from '../selectors/app'
import selectors, { Contact } from '../selectors/contacts'
import { directMessageChannel } from '../selectors/directMessageChannel'
import directMessagesQueue from '../selectors/directMessagesQueue'
import { messages as zbayMessages } from '../../zbay'
import { getClient } from '../../zcash'
import { getVault } from '../../vault'
import { displayDirectMessageNotification } from '../../notifications'
import operationsHandlers, { operationTypes, PendingDirectMessageOp } from './operations'
import { ReceivedMessage } from './messages'
import directMessagesQueueHandlers, { checkConfirmationNumber } from './directMessagesQueue'
import channelHandlers from './channel'
import appHandlers from './app'
import notificationsHandlers from './notifications'
import { errorNotification } from './utils'

const sendDirectMessageOnEnter = event => async (dispatch, getState) => {
  const enterPressed = event.nativeEvent.keyCode === 13
  const shiftPressed = event.nativeEvent.shiftKey === true
  const privKey = identitySelectors.signerPrivKey(getState())
  const dmQueue = directMessagesQueue.queue(getState())
  const channel = directMessageChannel(getState()).toJS()
  const currentMessage = dmQueue.find(
    dm => dm.get('recipientAddress') === channel.targetRecipientAddress
  )
  if (enterPressed && !shiftPressed) {
    event.preventDefault()
    if (!event.target.value.replace(/\s/g, '').length) {
      return
    }
    let message
    if (currentMessage !== undefined) {
      message = zbayMessages.createMessage({
        messageData: {
          type: zbayMessages.messageType.BASIC,
          data: currentMessage.get('message').get('message') + '\n' + event.target.value,
          spent: '0.0001'
        },
        privKey
      })
    } else {
      message = zbayMessages.createMessage({
        messageData: {
          type: zbayMessages.messageType.BASIC,
          data: event.target.value,
          spent: '0.0001'
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
        type === zbayMessages.messageType.TRANSFER ? new BigNumber(spent) : new BigNumber('0.0001')
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
          : new BigNumber('0.0001')
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

const setMessages = createAction('SET_DIRECT_MESSAGES')
const setVaultMessages = createAction('SET_VAULT_DIRECT_MESSAGES')
const cleanNewMessages = createAction('CLEAN_NEW_DIRECT_MESSAGESS')
const appendNewMessages = createAction('APPEND_NEW_DIRECT_MESSAGES')
const setLastSeen = createAction('SET_CONTACTS_LAST_SEEN')
const setUsernames = createAction('SET_CONTACTS_USERNAMES')

export const actions = {
  setMessages,
  setVaultMessages,
  cleanNewMessages,
  appendNewMessages,
  setLastSeen,
  setUsernames
}
export const loadContact = address => async (dispatch, getState) => {
  const contact = selectors.contact(address)(getState())
  dispatch(updateLastSeen({ contact }))
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

    const senderToMessages = R.compose(
      R.groupBy(msg => msg.sender.replyTo),
      R.filter(R.identity)
    )(messages)
    if (!R.isEmpty(senderToMessages)) {
      R.keys(senderToMessages).forEach(async sender => {
        await dispatch(setUsernames({ sender: R.last(senderToMessages[sender]).sender }))
      })
    }
    await Promise.all(
      Object.entries(senderToMessages).map(async ([contactAddress, contactMessages]) => {
        const contact = contactMessages[0].sender
        await dispatch(loadVaultMessages({ contact }))
        const previousMessages = selectors.messages(contactAddress)(getState())
        let lastSeen = selectors.lastSeen(contactAddress)(getState())
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
  const vaultMessagesToDisplay = vaultMessages.map(msg =>
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

  dispatch(
    setUsernames({
      sender: {
        replyTo: contact.replyTo,
        username: contact.username
      }
    })
  )
}

export const loadAllSentMessages = () => async (dispatch, getState) => {
  const identityId = identitySelectors.id(getState())
  const identityAddress = identitySelectors.address(getState())
  const allMessages = await getVault().contacts.loadAllSentMessages({ identityId })
  allMessages.forEach(async contact => {
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

export const epics = {
  fetchMessages,
  updateLastSeen,
  sendDirectMessage,
  loadVaultMessages,
  sendDirectMessageOnEnter,
  loadAllSentMessages,
  resendMessage,
  loadContact,
  createVaultContact
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
