import Immutable from 'immutable'
import { DateTime } from 'luxon'
import { createAction, handleActions } from 'redux-actions'
import BigNumber from 'bignumber.js'
import { remote } from 'electron'

import {
  typeFulfilled,
  typeRejected,
  typePending,
  errorNotification,
  successNotification,
  LoaderState
} from './utils'
import notificationsHandlers from './notifications'
import channelHandlers from './channel'
import identitySelectors from '../selectors/identity'
import channelsSelectors from '../selectors/channels'
import channelSelectors from '../selectors/channel'
import modalsHandlers from './modals'
import { messages } from '../../zbay'
import { getVault } from '../../vault'
import { getClient } from '../../zcash'
import logsHandlers from '../../store/handlers/logs'
import { networkFee, actionTypes } from '../../../shared/static'
import history from '../../../shared/history'

const toBigNumber = x => new BigNumber(x)

export const ChannelsState = Immutable.Record(
  {
    data: Immutable.List(),
    loader: LoaderState({ loading: true })
  },
  'ChannelsState'
)

export const initialState = ChannelsState()

const loadChannels = createAction(
  actionTypes.LOAD_IDENTITY_CHANNELS,
  async id => {
    const channels = await getVault().channels.listChannels(id)
    return channels.map(channel => ({
      ...channel,
      advertFee: 0,
      onlyRegistered: false
    }))
  }
)
const loadChannelsToNode = createAction(
  actionTypes.LOAD_IDENTITY_CHANNELS,
  async id => {
    const channels = await getVault().channels.listChannels(id)
    try {
      await Promise.all(
        channels.map(channel =>
          getClient().keys.importIVK({
            ivk: channel.keys.ivk
          })
        )
      )
    } catch (error) {}

    await Promise.all(
      channels
        .filter(ch => ch.keys.sk)
        .map(channel =>
          getClient().keys.importSK({ sk: channel.keys.sk, rescan: 'no' })
        )
    )

    return channels.map(channel => ({
      ...channel,
      advertFee: 0,
      onlyRegistered: false
    }))
  }
)

const setLastSeen = createAction(actionTypes.SET_CHANNELS_LAST_SEEN)
const setDescription = createAction(actionTypes.SET_CHANNEL_DESCRIPTION)
const setUnread = createAction(actionTypes.SET_CHANNEL_UNREAD)
const setShowInfoMsg = createAction(actionTypes.SET_SHOW_INFO_MSG)
const setAdvertFee = createAction(actionTypes.SET_ADVERT_FEE)
const setOnlyRegistered = createAction(actionTypes.SET_ONLY_REGISTERED)

export const actions = {
  loadChannels,
  setLastSeen,
  setUnread,
  loadChannelsToNode,
  setDescription,
  setAdvertFee,
  setOnlyRegistered
}

const _createChannel = async (identityId, { name, description }) => {
  const address = await getClient().addresses.create('sapling')
  const [ivk, sk] = await Promise.all([
    getClient().keys.exportIVK(address),
    getClient().keys.exportSK(address)
  ])
  const channel = {
    address,
    name: name,
    description: description,
    private: true,
    keys: {
      ivk,
      sk
    }
  }
  await getVault().channels.importChannel(identityId, channel)
  return address
}

const createChannel = (values, formActions) => async (dispatch, getState) => {
  const closeModal = modalsHandlers.actionCreators.closeModal('createChannel')
  const balance = identitySelectors.balance('zec')(getState())
  try {
    if (balance.lt(0.0002)) {
      dispatch(
        notificationsHandlers.actions.enqueueSnackbar(
          errorNotification({
            message: `You need minimum 0.0002 ZEC to create a channel. `
          })
        )
      )
      formActions.setSubmitting(false)
      return
    }
    const identityId = identitySelectors.id(getState())
    const address = await _createChannel(identityId, values)
    dispatch(
      logsHandlers.epics.saveLogs({
        type: 'APPLICATION_LOGS',
        payload: `Creating channel ${address}`
      })
    )
    await dispatch(
      channelHandlers.epics.sendChannelSettingsMessage({ address: address })
    )
    dispatch(
      notificationsHandlers.actions.enqueueSnackbar(
        successNotification({
          message: `Successfully created ${values.name} channel.`
        })
      )
    )
    await dispatch(loadChannels(identityId))
    formActions.setSubmitting(false)
    const createdChannel = channelsSelectors
      .data(getState())
      .find(ch => ch.get('address') === address)
    if (createdChannel) {
      history.push(`/main/channel/${createdChannel.get('id')}`)
    }
    dispatch(closeModal())
  } catch (error) {
    dispatch(
      notificationsHandlers.actions.enqueueSnackbar(
        errorNotification({
          message: `Failed to create channel: ${error.message}`
        })
      )
    )
    formActions.setSubmitting(false)
  }
}

const withdrawMoneyFromChannels = () => async (dispatch, getState) => {
  const ownedChannels = channelsSelectors.ownedChannels(getState())
  let earnedAmount = toBigNumber(0)
  for (const channel of ownedChannels) {
    const channelAddress = channel.get('address')
    const amount = await getMoneyFromChannel(channelAddress)(dispatch, getState)
    earnedAmount = earnedAmount.plus(amount)
  }
  if (earnedAmount.gt(toBigNumber(0))) {
    dispatch(
      notificationsHandlers.actions.enqueueSnackbar(
        successNotification({
          message: `You will shortly receive ${earnedAmount.toFixed(
            4
          )} Zcash for commission from your created channels.`
        })
      )
    )
    dispatch(
      logsHandlers.epics.saveLogs({
        type: 'APPLICATION_LOGS',
        payload: `Creating new transfer with received money from channels`
      })
    )
  }
}

const getMoneyFromChannel = address => async (dispatch, getState) => {
  const amount = await getClient().accounting.balance(address)
  const identityAddress = identitySelectors.address(getState())
  if (amount.gt(0.0005)) {
    const transfer = messages.createEmptyTransfer({
      address: identityAddress,
      amount: amount.minus(networkFee).toString(),
      identityAddress: address
    })
    await getClient().payment.send(transfer)
    return amount.minus(networkFee)
  }
  return toBigNumber(0)
}

const updateLastSeen = ({ channelId }) => async (dispatch, getState) => {
  const identity = identitySelectors.data(getState())
  const lastSeen = DateTime.utc()
  const unread = channelSelectors.unread(getState())
  remote.app.badgeCount = remote.app.badgeCount - unread
  await getVault().channels.updateLastSeen({
    identityId: identity.get('id'),
    channelId,
    lastSeen
  })
  dispatch(setLastSeen({ channelId, lastSeen }))
  dispatch(setUnread({ channelId, unread: 0 }))
  dispatch(
    logsHandlers.epics.saveLogs({
      type: 'APPLICATION_LOGS',
      payload: `Updating last seen ${channelId}`
    })
  )
}
const updateSettings = ({ channelId, time, data }) => async (
  dispatch,
  getState
) => {
  const lastSeen = channelsSelectors.lastSeen(channelId)(getState())
  const timeOfTransaction = DateTime.fromSeconds(time)
  if (timeOfTransaction.plus({ minutes: 2 }) > lastSeen) {
    dispatch(updateShowInfoMsg(true))
  }
  dispatch(
    setDescription({ channelId, description: data.updateChannelDescription })
  )
  dispatch(
    setOnlyRegistered({
      channelId,
      onlyRegistered: !!parseInt(data.updateOnlyRegistered)
    })
  )
  dispatch(setAdvertFee({ channelId, advertFee: data.updateMinFee }))
  dispatch(
    logsHandlers.epics.saveLogs({
      type: 'APPLICATION_LOGS',
      payload: `Updating channel settings`
    })
  )
}

const updateShowInfoMsg = showInfoMsg => async (dispatch, getState) => {
  const channelId = channelSelectors.channelId(getState())
  const identity = identitySelectors.data(getState())
  await getVault().channels.updateShowInfoMsg({
    identityId: identity.get('id'),
    channelId,
    showInfoMsg: showInfoMsg === false ? '' : 'true'
  })
  dispatch(setShowInfoMsg({ channelId, showInfoMsg }))
}

export const epics = {
  createChannel,
  updateLastSeen,
  getMoneyFromChannel,
  withdrawMoneyFromChannels,
  updateShowInfoMsg,
  updateSettings
}

export const reducer = handleActions(
  {
    [typePending(actionTypes.LOAD_IDENTITY_CHANNELS)]: state =>
      state
        .setIn(['loader', 'loading'], true)
        .setIn(['loader', 'message'], 'Loading channels'),
    [typeFulfilled(actionTypes.LOAD_IDENTITY_CHANNELS)]: (
      state,
      { payload: data }
    ) =>
      state
        .set('data', Immutable.fromJS(data))
        .setIn(['loader', 'loading'], false),
    [typeRejected(actionTypes.LOAD_IDENTITY_CHANNELS)]: (
      state,
      { payload: error }
    ) => state.setIn(['loader', 'loading'], false),
    [setDescription]: (state, { payload: { channelId, description } }) => {
      const index = state.data.findIndex(
        channel => channel.get('id') === channelId
      )
      return state.updateIn(['data', index], ch =>
        ch.set('description', description)
      )
    },
    [setLastSeen]: (state, { payload: { channelId, lastSeen } }) => {
      const index = state.data.findIndex(
        channel => channel.get('id') === channelId
      )
      return state.updateIn(['data', index], ch => ch.set('lastSeen', lastSeen))
    },
    [setOnlyRegistered]: (
      state,
      { payload: { channelId, onlyRegistered } }
    ) => {
      const index = state.data.findIndex(
        channel => channel.get('id') === channelId
      )
      return state.updateIn(['data', index], ch =>
        ch.set('onlyRegistered', onlyRegistered)
      )
    },
    [setAdvertFee]: (state, { payload: { channelId, advertFee } }) => {
      const index = state.data.findIndex(
        channel => channel.get('id') === channelId
      )
      return state.updateIn(['data', index], ch =>
        ch.set('advertFee', parseFloat(advertFee))
      )
    },
    [setShowInfoMsg]: (state, { payload: { channelId, showInfoMsg } }) => {
      const index = state.data.findIndex(
        channel => channel.get('id') === channelId
      )
      return state.updateIn(['data', index], ch =>
        ch.set('showInfoMsg', showInfoMsg)
      )
    },
    [setUnread]: (state, { payload: { channelId, unread } }) => {
      const index = state.data.findIndex(
        channel => channel.get('id') === channelId
      )
      return state.updateIn(['data', index], ch => ch.set('unread', unread))
    }
  },
  initialState
)

export default {
  actions,
  epics,
  reducer
}
