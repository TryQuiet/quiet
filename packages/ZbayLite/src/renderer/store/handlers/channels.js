import Immutable from 'immutable'
import { DateTime } from 'luxon'
import { createAction, handleActions } from 'redux-actions'
import BigNumber from 'bignumber.js'

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
import modalsHandlers from './modals'
import { messages } from '../../zbay'
import { getVault } from '../../vault'
import { getClient } from '../../zcash'
import { networkFee } from '../../../shared/static'

const toBigNumber = x => new BigNumber(x)

export const ChannelsState = Immutable.Record(
  {
    data: Immutable.List(),
    loader: LoaderState({ loading: true })
  },
  'ChannelsState'
)

export const initialState = ChannelsState()

export const actionTypes = {
  LOAD_CHANNELS: 'LOAD_IDENTITY_CHANNELS',
  SET_LAST_SEEN: 'SET_CHANNELS_LAST_SEEN',
  SET_UNREAD: 'SET_CHANNEL_UNREAD'
}

const loadChannels = createAction(actionTypes.LOAD_CHANNELS, async id => {
  const channels = await getVault().channels.listChannels(id)

  return channels
})
const loadChannelsToNode = createAction(actionTypes.LOAD_CHANNELS, async id => {
  const channels = await getVault().channels.listChannels(id)
  await Promise.all(
    channels.map(channel =>
      getClient().keys.importIVK({ ivk: channel.keys.ivk, address: channel.address })
    )
  )
  await Promise.all(
    channels.filter(ch => ch.keys.sk).map(channel =>
      getClient().keys.importSK({ sk: channel.keys.sk, rescan: 'no' })
    )
  )
  return channels
})

const setLastSeen = createAction(actionTypes.SET_LAST_SEEN)
const setUnread = createAction(actionTypes.SET_UNREAD)

export const actions = {
  loadChannels,
  setLastSeen,
  setUnread,
  loadChannelsToNode
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
          errorNotification({ message: `You need minimum 0.0002 ZEC to create a channel. ` })
        )
      )
      formActions.setSubmitting(false)
      return
    }
    const identityId = identitySelectors.id(getState())
    const address = await _createChannel(identityId, values)
    await dispatch(channelHandlers.epics.sendChannelSettingsMessage({ address: address }))
    dispatch(
      notificationsHandlers.actions.enqueueSnackbar(
        successNotification({ message: `Successfully created ${values.name} channel.` })
      )
    )
    formActions.setSubmitting(false)
    dispatch(closeModal())
    dispatch(loadChannels(identityId))
  } catch (error) {
    dispatch(
      notificationsHandlers.actions.enqueueSnackbar(
        errorNotification({ message: `Failed to create channel: ${error.message}` })
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
          )} zash for commission from your created channels.`
        })
      )
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
  await getVault().channels.updateLastSeen({
    identityId: identity.get('id'),
    channelId,
    lastSeen
  })
  dispatch(setLastSeen({ channelId, lastSeen }))
  dispatch(setUnread({ channelId, unread: 0 }))
}

export const epics = {
  createChannel,
  updateLastSeen,
  getMoneyFromChannel,
  withdrawMoneyFromChannels
}

export const reducer = handleActions(
  {
    [typePending(actionTypes.LOAD_CHANNELS)]: state =>
      state.setIn(['loader', 'loading'], true).setIn(['loader', 'message'], 'Loading channels'),
    [typeFulfilled(actionTypes.LOAD_CHANNELS)]: (state, { payload: data }) =>
      state.set('data', Immutable.fromJS(data)).setIn(['loader', 'loading'], false),
    [typeRejected(actionTypes.LOAD_CHANNELS)]: (state, { payload: error }) =>
      state.setIn(['loader', 'loading'], false),
    [setLastSeen]: (state, { payload: { channelId, lastSeen } }) => {
      const index = state.data.findIndex(channel => channel.get('id') === channelId)
      return state.updateIn(['data', index], ch => ch.set('lastSeen', lastSeen))
    },
    [setUnread]: (state, { payload: { channelId, unread } }) => {
      const index = state.data.findIndex(channel => channel.get('id') === channelId)
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
