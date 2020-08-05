import Immutable from 'immutable'
import BigNumber from 'bignumber.js'
import { createAction, handleActions } from 'redux-actions'
import crypto from 'crypto'
import * as R from 'ramda'
import { DateTime } from 'luxon'

import history from '../../../shared/history'
import operationsHandlers, {
  operationTypes,
  PendingMessageOp
} from './operations'
import notificationsHandlers from './notifications'
// import messagesQueueHandlers from './messagesQueue'
import messagesHandlers, { _checkMessageSize } from './messages'
import channelsHandlers from './channels'
import offersHandlers from './offers'
import channelSelectors from '../selectors/channel'
import identitySelectors from '../selectors/identity'
import contactsSelectors from '../selectors/contacts'
import client from '../../zcash'
import { messages } from '../../zbay'
import { errorNotification, LoaderState } from './utils'
import { messageType, actionTypes } from '../../../shared/static'
import { DisplayableMessage } from '../../zbay/messages'
import usersSelectors from '../selectors/users'
import contactsHandlers from './contacts'
import electronStore from '../../../shared/electronStore'
import { channelToUri } from '../../../renderer/zbay/channels'

export const ChannelState = Immutable.Record(
  {
    spentFilterValue: new BigNumber(0),
    id: null,
    message: Immutable.Map(),
    shareableUri: '',
    address: '',
    loader: LoaderState({ loading: false }),
    members: null,
    showInfoMsg: true,
    isSizeCheckingInProgress: false,
    messageSizeStatus: null
  },
  'ChannelState'
)

export const initialState = ChannelState()

const setSpentFilterValue = createAction(
  actionTypes.SET_SPENT_FILTER_VALUE,
  (_, value) => value
)
const setMessage = createAction(actionTypes.SET_CHANNEL_MESSAGE)
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
  messageSizeStatus
}

const loadChannel = key => async (dispatch, getState) => {
  try {
    dispatch(setChannelId(key))

    // Calculate URI on load, that way it won't be outdated, even if someone decides
    // to update channel in vault manually
    const contact = contactsSelectors.contact(key)(getState())
    const ivk = electronStore.get(
      `defaultChannels.${contact.get('address')}.keys.ivk`
    )
    if (ivk) {
      const uri = await channelToUri({
        name: contact.get('username'),
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
  history.push(`/main/channel/${targetChannel.address}`)
}
const sendOnEnter = (event, resetTab) => async (dispatch, getState) => {
  if (resetTab) {
    resetTab(0)
  }
  const enterPressed = event.nativeEvent.keyCode === 13
  const shiftPressed = event.nativeEvent.shiftKey === true
  const channel = channelSelectors.channel(getState()).toJS()
  const messageToSend = channelSelectors.message(getState())
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

      const messageEssentials = R.pick(['createdAt', 'message', 'spent'])(
        message
      )
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
      const transfer = await messages.messageToTransfer({
        message: message,
        address: channel.address
      })
      const transaction = await client.sendTransaction(transfer)
      console.log(transaction, 'transaction details')
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
    await client.payment.send(transfer)
  } catch (err) {
    notificationsHandlers.actions.enqueueSnackbar(
      dispatch(
        errorNotification({
          message: "Couldn't create channel, please check node connection."
        })
      )
    )
  }
}

const resendMessage = messageData => async (dispatch, getState) => {
  dispatch(operationsHandlers.actions.removeOperation(messageData.id))
  const identityAddress = identitySelectors.address(getState())
  const channel = channelSelectors.data(getState()).toJS()
  const privKey = identitySelectors.signerPrivKey(getState())
  const message = messages.createMessage({
    messageData: {
      type: messageData.type,
      data: messageData.message,
      spent: '0'
    },
    privKey
  })
  const transfer = await messages.messageToTransfer({
    message,
    address: channel.address,
    identityAddress
  })
  try {
    const opId = await client.payment.send(transfer)
    await dispatch(
      operationsHandlers.epics.observeOperation({
        opId,
        type: operationTypes.pendingMessage,
        meta: PendingMessageOp({
          channelId: channel.id,
          message: Immutable.fromJS(message)
        })
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
      state.setIn(['loader', 'loading'], loading),
    [setLoadingMessage]: (state, { payload: message }) =>
      state.setIn(['loader', 'message'], message),
    [setSpentFilterValue]: (state, { payload: value }) =>
      state.set('spentFilterValue', new BigNumber(value)),
    [setMessage]: (state, { payload: value }) =>
      state.setIn(['message', state.get('id')], value),
    [setChannelId]: (state, { payload: id }) => state.set('id', id),
    [isSizeCheckingInProgress]: (state, { payload }) =>
      state.set('isSizeCheckingInProgress', payload),
    [messageSizeStatus]: (state, { payload }) =>
      state.set('messageSizeStatus', payload),
    [setShareableUri]: (state, { payload: uri }) =>
      state.set('shareableUri', uri),
    [setAddress]: (state, { payload: address }) =>
      state.set('address', address),
    [resetChannel]: () => initialState
  },
  initialState
)

export default {
  reducer,
  epics,
  actions
}
