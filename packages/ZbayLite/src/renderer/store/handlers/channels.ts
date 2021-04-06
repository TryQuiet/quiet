import { produce, immerable } from 'immer'
import { DateTime } from 'luxon'
import { createAction, handleActions, Action } from 'redux-actions'
import BigNumber from 'bignumber.js'
import { remote } from 'electron'

import {
  typeFulfilled,
  typeRejected,
  typePending,
  errorNotification,
  successNotification
} from './utils'
import notificationsHandlers from './notifications'
import channelHandlers from './channel'
import identitySelectors from '../selectors/identity'
import channelsSelectors from '../selectors/channels'
import publicChannelsSelectors from '../selectors/publicChannels'
import channelSelectors from '../selectors/channel'
import modalsHandlers from './modals'
import { messages } from '../../zbay'
import client from '../../zcash'
import { networkFee, actionTypes } from '../../../shared/static'
import history from '../../../shared/history'
import electronStore from '../../../shared/electronStore'
import contactsHandlers from './contacts'
import ownedChannelsHandlers from './ownedChannels'
import contactsSelectors from '../selectors/contacts'
import { publicChannelsActions } from '../../sagas/publicChannels/publicChannels.reducer'

import { ActionsType, PayloadType } from './types'

const toBigNumber = x => new BigNumber(x)

// TODO: remove after changing in tests
export const ChannelsState = {
  data: [],
  loader: {
    loading: false,
    message: ''
  }
}
interface Channel {
  id: string
  description: string
  lastSeen: DateTime
  onlyRegistered: boolean
  advertFee: number
  showInfoMsg: boolean
  unread: number
}
class Channels {
  data: Channel[]
  loader: {
    loading: boolean
    message: string
  }

  constructor(values?: Partial<Channels>) {
    Object.assign(this, values)
    this[immerable] = true
  }
}

export const initialState: Channels = new Channels({
  data: [],
  loader: {
    loading: false,
    message: ''
  }
})

const loadChannels = createAction(actionTypes.LOAD_IDENTITY_CHANNELS, async () => {
  return ''
})

const loadChannelsToNode = createAction(actionTypes.LOAD_IDENTITY_CHANNELS, async () => {
  return ''
})

export type ChannelsStore = Channels

const setLastSeen = createAction<{ channelId: string; lastSeen: DateTime }>(
  actionTypes.SET_CHANNELS_LAST_SEEN
)
const setDescription = createAction<{ channelId: string; description: string }>(
  actionTypes.SET_CHANNEL_DESCRIPTION
)
const setUnread = createAction<{ unread: number; channelId: string }>(
  actionTypes.SET_CHANNEL_UNREAD
)
const setShowInfoMsg = createAction<{ channelId: string; showInfoMsg: boolean }>(
  actionTypes.SET_SHOW_INFO_MSG
)
const setAdvertFee = createAction<{ channelId: string; advertFee: string }>(
  actionTypes.SET_ADVERT_FEE
)
const setOnlyRegistered = createAction<{ channelId: string; onlyRegistered: boolean }>(
  actionTypes.SET_ONLY_REGISTERED
)

export const actions = {
  loadChannels,
  setLastSeen,
  setUnread,
  loadChannelsToNode,
  setDescription,
  setAdvertFee,
  setOnlyRegistered,
  setShowInfoMsg
}

export type ChannelsActions = ActionsType<typeof actions>

const _createChannel = async () => {
  const address = await client.getNewShieldedAdress()
  return address
}

const createChannel = (values, formActions, setStep) => async (dispatch, getState) => {
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
    const address = await _createChannel()
    const result = await dispatch(
      channelHandlers.epics.sendChannelSettingsMessage({ address: address })
    )
    if (result === -1) {
      setStep(0)
      dispatch(closeModal())
      return
    }
    const importedChannels = electronStore.get('importedChannels') || {}
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

const subscribeForPublicChannels = () => async (dispatch, getState) => {
  /** Subscribe for public channels from contacts (joined public channels) */
  const publicChannelsContacts = contactsSelectors.publicChannelsContacts(getState())
  for (const publicChannel of publicChannelsContacts) {
    const channel = publicChannelsSelectors.publicChannelsByName(publicChannel.username)(getState())
    console.log('subscribing for ', channel.name)
    if (channel) {
      dispatch(publicChannelsActions.subscribeForTopic(channel))
    }
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
  }
}

const getMoneyFromChannel = address => async (_dispatch, getState) => {
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
}
const updateSettings = ({ channelId, time, data }) => async (dispatch, getState) => {
  const lastSeen = channelsSelectors.lastSeen(channelId)(getState())
  const timeOfTransaction = DateTime.fromSeconds(time)
  if (timeOfTransaction.plus({ minutes: 2 }) > lastSeen) {
    dispatch(updateShowInfoMsg(true))
  }
  dispatch(setDescription({ channelId, description: data.updateChannelDescription }))
  dispatch(
    setOnlyRegistered({
      channelId,
      onlyRegistered: !!parseInt(data.updateOnlyRegistered)
    })
  )
  dispatch(setAdvertFee({ channelId, advertFee: data.updateMinFee }))
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
  updateSettings,
  subscribeForPublicChannels
}

export const reducer = handleActions<ChannelsStore, PayloadType<ChannelsActions>>(
  {
    [typePending(actionTypes.LOAD_IDENTITY_CHANNELS)]: state =>
      produce(state, draft => {
        draft.loader.loading = true
        draft.loader.message = 'Loading channel'
      }),
    [typeFulfilled(actionTypes.LOAD_IDENTITY_CHANNELS)]: (state, { payload: data }: Action<any>) =>
      produce(state, draft => {
        draft.data = data
        draft.loader.loading = false
      }),
    [typeRejected(actionTypes.LOAD_IDENTITY_CHANNELS)]: state =>
      produce(state, draft => {
        draft.loader.loading = false
      }),
    [setDescription.toString()]: (
      state,
      { payload: { channelId, description } }: ChannelsActions['setDescription']
    ) =>
      produce(state, draft => {
        const index = state.data.findIndex(channel => channel.id === channelId)
        draft.data[index].description = description
      }),
    [setLastSeen.toString()]: (
      state,
      { payload: { channelId, lastSeen } }: ChannelsActions['setLastSeen']
    ) =>
      produce(state, draft => {
        const index = state.data.findIndex(channel => channel.id === channelId)
        draft.data[index].lastSeen = lastSeen
      }),
    [setOnlyRegistered.toString()]: (
      state,
      { payload: { channelId, onlyRegistered } }: ChannelsActions['setOnlyRegistered']
    ) =>
      produce(state, draft => {
        const index = state.data.findIndex(channel => channel.id === channelId)
        draft.data[index].onlyRegistered = onlyRegistered
      }),
    [setAdvertFee.toString()]: (
      state,
      { payload: { channelId, advertFee } }: ChannelsActions['setAdvertFee']
    ) =>
      produce(state, draft => {
        const index = state.data.findIndex(channel => channel.id === channelId)
        draft.data[index].advertFee = parseFloat(advertFee)
      }),
    [setShowInfoMsg.toString()]: (
      state,
      { payload: { channelId, showInfoMsg } }: ChannelsActions['setShowInfoMsg']
    ) =>
      produce(state, draft => {
        const index = state.data.findIndex(channel => channel.id === channelId)
        draft.data[index].showInfoMsg = showInfoMsg
      }),
    [setUnread.toString()]: (
      state,
      { payload: { channelId, unread } }: ChannelsActions['setUnread']
    ) =>
      produce(state, draft => {
        const index = state.data.findIndex(channel => channel.id === channelId)
        draft.data[index].unread = unread
      })
  },
  initialState
)

export default {
  actions,
  epics,
  reducer
}
