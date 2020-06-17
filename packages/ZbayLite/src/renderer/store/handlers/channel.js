import Immutable from 'immutable'
import BigNumber from 'bignumber.js'
import { createAction, handleActions } from 'redux-actions'

import history from '../../../shared/history'
import operationsHandlers, {
  operationTypes,
  PendingMessageOp
} from './operations'
import notificationsHandlers from './notifications'
import messagesQueueHandlers from './messagesQueue'
import messagesQueue from '../selectors/messagesQueue'
import messagesHandlers, { _checkMessageSize } from './messages'
import channelsHandlers from './channels'
import offersHandlers from './offers'
import appHandlers from './app'
import channelSelectors from '../selectors/channel'
import channelsSelectors from '../selectors/channels'
import identitySelectors from '../selectors/identity'
import appSelectors from '../selectors/app'
import logsHandlers from '../handlers/logs'
import { getClient } from '../../zcash'
import { messages } from '../../zbay'
import { errorNotification, LoaderState } from './utils'
import { channelToUri } from '../../zbay/channels'
import nodeSelectors from '../selectors/node'
import { getVault } from '../../vault'
import { messageType, actionTypes } from '../../../shared/static'

export const ChannelState = Immutable.Record(
  {
    spentFilterValue: new BigNumber(0),
    id: null,
    message: '',
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

const loadChannel = id => async (dispatch, getState) => {
  try {
    dispatch(setChannelId(id))

    // Calculate URI on load, that way it won't be outdated, even if someone decides
    // to update channel in vault manually
    const channel = channelSelectors.data(getState()).toJS()
    const uri = await channelToUri(channel)
    dispatch(setShareableUri(uri))
    dispatch(setAddress(channel.address))
    await dispatch(clearNewMessages())
    await dispatch(updateLastSeen())
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
  let channels = channelsSelectors.channels(getState())
  let channel = channels.data.find(
    channel => channel.get('address') === targetChannel.address
  )
  const identityId = identitySelectors.id(getState())
  const lastblock = nodeSelectors.latestBlock(getState())
  const fetchTreshold = lastblock - 2000
  if (channel) {
    history.push(`/main/channel/${channel.get('id')}`)
    return
  }
  try {
    try {
      await getVault().channels.importChannel(identityId, targetChannel)
      getClient().keys.importIVK({
        ivk: targetChannel.keys.ivk,
        rescan: 'yes',
        startHeight: fetchTreshold
      })
    } catch (error) {}
    dispatch(
      logsHandlers.epics.saveLogs({
        type: 'APPLICATION_LOGS',
        payload: `Importing channel ${targetChannel}`
      })
    )
    await dispatch(channelsHandlers.actions.loadChannels(identityId))
    channels = channelsSelectors.channels(getState())
    channel = channels.data.find(
      channel => channel.get('address') === targetChannel.address
    )
    await dispatch(messagesHandlers.epics.fetchMessages(channel))
    dispatch(
      notificationsHandlers.actions.enqueueSnackbar({
        message: `Successfully imported channel ${targetChannel.name}`,
        options: {
          variant: 'success'
        }
      })
    )
    history.push(`/main/channel/${channel.get('id')}`)
  } catch (err) {
    console.log(err)
  }
}
const sendOnEnter = (event, resetTab) => async (dispatch, getState) => {
  if (resetTab) {
    resetTab(0)
  }
  const enterPressed = event.nativeEvent.keyCode === 13
  const shiftPressed = event.nativeEvent.shiftKey === true
  const channel = channelSelectors.data(getState()).toJS()
  const messageToSend = channelSelectors.message(getState())
  const messageQueueLock = appSelectors.messageQueueLock(getState())
  let locked = false
  const msgQueue = messagesQueue.queue(getState())
  const currentMessage = msgQueue
    .find(dm => dm.get('channelId') === channel.id)
  const msgKey = msgQueue
    .findKey(dm => dm.get('channelId') === channel.id)
  if (enterPressed && !shiftPressed) {
    if (!messageQueueLock) {
      await dispatch(appHandlers.actions.lockMessageQueue())
      locked = true
    }
    event.preventDefault()
    const privKey = identitySelectors.signerPrivKey(getState())
    let message
    if (currentMessage !== undefined && locked) {
      await dispatch(messagesQueueHandlers.actions.removeMessage(msgKey))
      message = messages.createMessage({
        messageData: {
          type: messageType.BASIC,
          data:
            currentMessage.get('message').get('message') + '\n' + messageToSend
        },
        privKey: privKey
      })
    } else {
      message = messages.createMessage({
        messageData: {
          type: messageType.BASIC,
          data: messageToSend
        },
        privKey: privKey
      })
    }
    const isMergedMessageTooLong = await dispatch(
      _checkMessageSize(message.message)
    )
    if (!isMergedMessageTooLong) {
      dispatch(
        messagesQueueHandlers.epics.addMessage({
          message,
          channelId: channel.id
        })
      )
      dispatch(setMessage(''))
    }
    if (locked) {
      dispatch(appHandlers.actions.unlockMessageQueue())
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
    await getClient().payment.send(transfer)
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
    const opId = await getClient().payment.send(transfer)
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
    [setMessage]: (state, { payload: value }) => state.set('message', value),
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
