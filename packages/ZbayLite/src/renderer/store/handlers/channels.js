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
import client from '../../zcash'
import logsHandlers from '../../store/handlers/logs'
import { networkFee, actionTypes } from '../../../shared/static'
import history from '../../../shared/history'
import electronStore from '../../../shared/electronStore'
import contactsHandlers from './contacts'
import ownedChannelsHandlers from './ownedChannels'

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
    return ''
  }
)
const loadChannelsToNode = createAction(
  actionTypes.LOAD_IDENTITY_CHANNELS,
  async (id, isNewUser) => {
    return ''
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

const _createChannel = async values => {
  const address = await client.getNewShieldedAdress()
  return address
}

const createChannel = (values, formActions, setStep) => async (
  dispatch,
  getState
) => {
  const closeModal = modalsHandlers.actionCreators.closeModal('createChannel')
  const balance = identitySelectors.balance('zec')(getState())
  const signerPubKey = identitySelectors.signerPubKey(getState())
  try {
    if (balance.lt(networkFee)) {
      dispatch(
        notificationsHandlers.actions.enqueueSnackbar(
          errorNotification({
            message: `You need minimum ${networkFee} ZEC to create a channel. `
          })
        )
      )
      formActions.setSubmitting(false)
      return
    }
    setStep(1)
    const address = await _createChannel(values)
    dispatch(
      logsHandlers.epics.saveLogs({
        type: 'APPLICATION_LOGS',
        payload: `Creating channel ${address}`
      })
    )
    const result = await dispatch(
      channelHandlers.epics.sendChannelSettingsMessage({ address: address })
    )
    if (result === -1) {
      setStep(0)
      dispatch(closeModal())
      return
    }
    const importedChannels = electronStore.get(`importedChannels`) || {}
    const viewingKey = await client.getViewingKey(address)
    electronStore.set('importedChannels', {
      ...importedChannels,
      [address]: {
        address: address,
        name: values.name,
        description: '',
        owner: signerPubKey,
        keys: { ivk: viewingKey }
      }
    })
    await dispatch(
      contactsHandlers.actions.addContact({
        key: address,
        contactAddress: address,
        username: values.name
      })
    )
    dispatch(ownedChannelsHandlers.epics.getOwnedChannels())
    history.push(`/main/channel/${address}`)
    dispatch(
      notificationsHandlers.actions.enqueueSnackbar(
        successNotification({
          message: `Successfully created ${values.name} channel.`
        })
      )
    )
    setStep(0)
    dispatch(closeModal())
  } catch (error) {
    dispatch(
      notificationsHandlers.actions.enqueueSnackbar(
        errorNotification({
          message: `Failed to create channel: ${error.message}`
        })
      )
    )
    setStep(0)
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
  const amount = await client.accounting.balance(address)
  const identityAddress = identitySelectors.address(getState())
  if (amount.gt(0.0005)) {
    const transfer = messages.createEmptyTransfer({
      address: identityAddress,
      amount: amount.minus(networkFee).toString(),
      identityAddress: address
    })
    await client.payment.send(transfer)
    return amount.minus(networkFee)
  }
  return toBigNumber(0)
}

const updateLastSeen = ({ channelId }) => async (dispatch, getState) => {
  const lastSeen = DateTime.utc()
  const unread = channelSelectors.unread(getState())
  remote.app.badgeCount = remote.app.badgeCount - unread
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
