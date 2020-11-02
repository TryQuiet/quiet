import { produce } from 'immer'
import BigNumber from 'bignumber.js'
import { createAction, handleActions } from 'redux-actions'
import crypto from 'crypto'
import * as R from 'ramda'
import { remote } from 'electron'
import { DateTime } from 'luxon'

import history from '../../../shared/history'
import operationsHandlers from './operations'
import notificationsHandlers from './notifications'
// import messagesQueueHandlers from './messagesQueue'
import messagesHandlers, { _checkMessageSize } from './messages'
import channelsHandlers from './channels'
import offersHandlers from './offers'
import channelSelectors from '../selectors/channel'
import identitySelectors from '../selectors/identity'
import contactsSelectors from '../selectors/contacts'
import appSelectors from '../selectors/app'
import client from '../../zcash'
import { messages } from '../../zbay'
import { errorNotification } from './utils'
import { messageType, actionTypes } from '../../../shared/static'
import { DisplayableMessage } from '../../zbay/messages'
import usersSelectors from '../selectors/users'
import contactsHandlers from './contacts'
import electronStore from '../../../shared/electronStore'
import { channelToUri } from '../../../renderer/zbay/channels'
import { sendMessage } from '../../zcash/websocketClient'
import { packMemo } from '../../zbay/transit'

export const ChannelState = {
  spentFilterValue: new BigNumber(0),
  id: null,
  message: {},
  shareableUri: '',
  address: '',
  loader: {
    loading: false,
    message: ''
  },
  members: null,
  showInfoMsg: true,
  isSizeCheckingInProgress: false,
  messageSizeStatus: null,
  displayableMessageLimit: 50
}

export const initialState = {
  ...ChannelState
}

const setSpentFilterValue = createAction(
  actionTypes.SET_SPENT_FILTER_VALUE,
  (_, value) => value
)
const setMessage = createAction(actionTypes.SET_CHANNEL_MESSAGE)
const setDisplayableLimit = createAction(actionTypes.SET_DISPLAYABLE_LIMIT)
const setChannelId = createAction(actionTypes.SET_CHANNEL_ID)
const setLoading = createAction(actionTypes.SET_CHANNEL_LOADING)
const setLoadingMessage = createAction(actionTypes.SET_CHANNEL_LOADING_MESSAGE)
const setShareableUri = createAction(actionTypes.SET_CHANNEL_SHAREABLE_URI)
const setAddress = createAction(actionTypes.SET_CHANNEL_ADDRESS)
const resetChannel = createAction(actionTypes.SET_CHANNEL)
const isSizeCheckingInProgress = createAction(
  actionTypes.IS_SIZE_CHECKING_IN_PROGRESS
)
const messageSizeStatus = createAction(actionTypes.MESSAGE_SIZE_STATUS)

export const actions = {
  setLoading,
  setLoadingMessage,
  setSpentFilterValue,
  setMessage,
  setShareableUri,
  setChannelId,
  resetChannel,
  isSizeCheckingInProgress,
  messageSizeStatus,
  setDisplayableLimit
}

const loadChannel = key => async (dispatch, getState) => {
  try {
    dispatch(setChannelId(key))
    dispatch(setDisplayableLimit(30))
    // Calculate URI on load, that way it won't be outdated, even if someone decides
    // to update channel in vault manually
    const contact = contactsSelectors.contact(key)(getState())
    const unread = contact.newMessages.length
    remote.app.setBadgeCount(remote.app.getBadgeCount() - unread)
    const ivk =
      electronStore.get(`defaultChannels.${contact.address}.keys.ivk`) ||
      electronStore.get(`importedChannels.${contact.address}.keys.ivk`)
    if (ivk) {
      const uri = await channelToUri({
        name: contact.username,
        ivk
      })
      dispatch(setShareableUri(uri))
    }
    electronStore.set(
      `lastSeen.${key}`,
      parseInt(DateTime.utc().toSeconds()).toString()
    )
    dispatch(setAddress(contact.address))

    dispatch(contactsHandlers.actions.cleanNewMessages({ contactAddress: key }))
    // await dispatch(clearNewMessages())
    // await dispatch(updateLastSeen())
  } catch (err) {}
}
const loadOffer = (id, address) => async (dispatch, getState) => {
  try {
    await dispatch(offersHandlers.epics.updateLastSeen({ itemId: id }))
    dispatch(setChannelId(id))
    dispatch(setShareableUri(''))
    dispatch(setAddress(address))
  } catch (err) {}
}
const linkChannelRedirect = targetChannel => async (dispatch, getState) => {
  const contact = contactsSelectors.contact(targetChannel.address)(getState())
  if (contact.address) {
    history.push(`/main/channel/${targetChannel.address}`)
    return
  }
  electronStore.set(`channelsToRescan.${targetChannel.address}`, true)
  const importedChannels = electronStore.get(`importedChannels`) || {}
  electronStore.set('importedChannels', {
    ...importedChannels,
    [targetChannel.address]: {
      address: targetChannel.address,
      name: targetChannel.name,
      description: targetChannel.description,
      owner: targetChannel.owner,
      keys: targetChannel.keys
    }
  })
  // We can parse timestamp to blocktime and get accurate birthday block for this channel
  // Skipped since we dont support rescaning also we already got birthday of zbay as main wallet birthday
  await client.importKey(targetChannel.keys.ivk)
  await dispatch(
    contactsHandlers.actions.addContact({
      key: targetChannel.address,
      contactAddress: targetChannel.address,
      username: targetChannel.name
    })
  )

  history.push(`/main/channel/${targetChannel.address}`)
}
const sendOnEnter = (event, resetTab) => async (dispatch, getState) => {
  if (resetTab) {
    resetTab(0)
  }
  const enterPressed = event.nativeEvent.keyCode === 13
  const shiftPressed = event.nativeEvent.shiftKey === true
  const channel = channelSelectors.channel(getState())
  const messageToSend = channelSelectors.message(getState())
  const users = usersSelectors.users(getState())
  const useTor = appSelectors.useTor(getState())
  let message
  if (enterPressed && !shiftPressed) {
    event.preventDefault()
    const privKey = identitySelectors.signerPrivKey(getState())
    message = messages.createMessage({
      messageData: {
        type: messageType.BASIC,
        data: messageToSend
      },
      privKey: privKey
    })
    const isMergedMessageTooLong = await dispatch(
      _checkMessageSize(message.message)
    )
    if (!isMergedMessageTooLong) {
      dispatch(setMessage(''))
      const myUser = usersSelectors.myUser(getState())
      const messageDigest = crypto.createHash('sha256')
      const messageEssentials = R.pick(['createdAt', 'message'])(message)
      const key = messageDigest
        .update(JSON.stringify(messageEssentials))
        .digest('hex')

      const messagePlaceholder = DisplayableMessage({
        ...message,
        id: key,
        sender: {
          replyTo: myUser.address,
          username: myUser.nickname
        },
        fromYou: true,
        status: 'pending',
        message: messageToSend
      })
      dispatch(
        contactsHandlers.actions.addMessage({
          key: channel.id,
          message: { [key]: messagePlaceholder }
        })
      )
      dispatch(
        operationsHandlers.actions.addOperation({
          channelId: channel.id,
          id: key
        })
      )

      const identityAddress = identitySelectors.address(getState())
      if (useTor && users[channel.id] && users[channel.id].onionAddress) {
        try {
          const memo = await packMemo(message)
          const result = await sendMessage(
            memo,
            users[channel.id].onionAddress
          )
          if (result === -1) {
            throw new Error('unable to connect')
          }
          return
        } catch (error) {
          console.log(error)
          console.log('socket timeout')
        }
      }

      const transfer = await messages.messageToTransfer({
        message: message,
        address: channel.address,
        identityAddress
      })
      const transaction = await client.sendTransaction(transfer)
      if (!transaction.txid) {
        dispatch(
          contactsHandlers.actions.addMessage({
            key: channel.id,
            message: { [key]: {
              ...messagePlaceholder,
              status: 'failed'
            }
            } })
        )
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
      dispatch(
        operationsHandlers.epics.resolvePendingOperation({
          channelId: channel.id,
          id: key,
          txid: transaction.txid
        })
      )
    }
  }
}
const sendChannelSettingsMessage = ({
  address,
  minFee = '0',
  onlyRegistered = '0'
}) => async (dispatch, getState) => {
  const identityAddress = identitySelectors.address(getState())
  const owner = identitySelectors.signerPubKey(getState())
  const privKey = identitySelectors.signerPrivKey(getState())
  const message = messages.createMessage({
    messageData: {
      type: messageType.CHANNEL_SETTINGS,
      data: {
        owner,
        minFee,
        onlyRegistered
      }
    },
    privKey: privKey
  })
  const transfer = await messages.messageToTransfer({
    message,
    address: address,
    identityAddress
  })
  try {
    const txid = await client.sendTransaction(transfer)
    if (txid.error) {
      throw new Error(txid.error)
    }
    return 1
  } catch (err) {
    dispatch(
      notificationsHandlers.actions.enqueueSnackbar(
        errorNotification({
          message: "Couldn't create channel, please check node connection."
        })
      )
    )
    return -1
  }
}

const resendMessage = messageData => async (dispatch, getState) => {
  const identityAddress = identitySelectors.address(getState())
  const channel = channelSelectors.data(getState())
  const privKey = identitySelectors.signerPrivKey(getState())
  const message = messages.createMessage({
    messageData: {
      type: messageData.type,
      data: messageData.message,
      spent: parseFloat(messageData.spent.toString())
    },
    privKey
  })
  const transfer = await messages.messageToTransfer({
    message,
    address: channel.address,
    amount: parseFloat(messageData.spent.toString()),
    identityAddress
  })
  const messagePlaceholder = DisplayableMessage({
    ...messageData,
    status: 'pending'
  })
  dispatch(
    contactsHandlers.actions.addMessage({
      key: channel.key,
      message: { [messageData.id]: messagePlaceholder }
    })
  )
  const transaction = await client.sendTransaction(transfer)
  if (!transaction.txid) {
    dispatch(
      contactsHandlers.actions.addMessage({
        key: channel.key,
        message: {
          [messageData.id]: {
            ...messagePlaceholder,
            status: 'failed'
          }
        }
      })
    )
    dispatch(
      notificationsHandlers.actions.enqueueSnackbar(
        errorNotification({
          message: "Couldn't send the message, please check node connection."
        })
      )
    )
    return
  }
  dispatch(
    operationsHandlers.epics.resolvePendingOperation({
      channelId: channel.key,
      id: messageData.id,
      txid: transaction.txid
    })
  )
}

const updateLastSeen = () => async (dispatch, getState) => {
  const channelId = channelSelectors.channelId(getState())
  return dispatch(channelsHandlers.epics.updateLastSeen({ channelId }))
}

const clearNewMessages = () => async (dispatch, getState) => {
  const channelId = channelSelectors.channelId(getState())
  dispatch(messagesHandlers.actions.cleanNewMessages({ channelId }))
}

export const epics = {
  sendOnEnter,
  loadChannel,
  resendMessage,
  clearNewMessages,
  updateLastSeen,
  loadOffer,
  sendChannelSettingsMessage,
  linkChannelRedirect
}

// TODO: we should have a global loader map
export const reducer = handleActions(
  {
    [setLoading]: (state, { payload: loading }) =>
      produce(state, (draft) => {
        draft.loader.loading = loading
      }),
    [setLoadingMessage]: (state, { payload: message }) =>
      produce(state, (draft) => {
        draft.loader.message = message
      }),
    [setSpentFilterValue]: (state, { payload: value }) =>
      produce(state, (draft) => {
        draft.spentFilterValue = new BigNumber(value)
      }),
    [setMessage]: (state, { payload: value }) =>
      produce(state, (draft) => {
        draft.message[draft.id] = value
      }),
    [setChannelId]: (state, { payload: id }) => produce(state, (draft) => {
      draft.id = id
    }),
    [isSizeCheckingInProgress]: (state, { payload }) =>
      produce(state, (draft) => {
        draft.isSizeCheckingInProgress = payload
      }),
    [messageSizeStatus]: (state, { payload }) =>
      produce(state, (draft) => {
        draft.messageSizeStatus = payload
      }),
    [setShareableUri]: (state, { payload: uri }) =>
      produce(state, (draft) => {
        draft.shareableUri = uri
      }),
    [setDisplayableLimit]: (state, { payload: limit }) =>
      produce(state, (draft) => {
        draft.displayableMessageLimit = limit
      }),
    [setAddress]: (state, { payload: address }) =>
      produce(state, (draft) => {
        draft.address = address
      }),
    [resetChannel]: () => initialState
  },
  initialState
)

export default {
  reducer,
  epics,
  actions
}
