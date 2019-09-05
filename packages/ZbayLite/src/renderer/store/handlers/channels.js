import Immutable from 'immutable'
import { DateTime } from 'luxon'
import { createAction, handleActions } from 'redux-actions'

import {
  typeFulfilled,
  typeRejected,
  typePending,
  errorNotification,
  successNotification,
  LoaderState
} from './utils'
import notificationsHandlers from './notifications'
import identitySelectors from '../selectors/identity'
import modalsHandlers from './modals'

import { getVault } from '../../vault'
import { getClient } from '../../zcash'

export const ChannelsState = Immutable.Record({
  data: Immutable.List(),
  loader: LoaderState({ loading: true })
}, 'ChannelsState')

export const initialState = ChannelsState()

export const actionTypes = {
  LOAD_CHANNELS: 'LOAD_IDENTITY_CHANNELS',
  SET_LAST_SEEN: 'SET_CHANNELS_LAST_SEEN',
  SET_UNREAD: 'SET_CHANNEL_UNREAD'
}

const loadChannels = createAction(actionTypes.LOAD_CHANNELS, async (id) => {
  const channels = await getVault().channels.listChannels(id)

  await Promise.all(
    channels.map(
      channel => getClient().keys.importIVK({ ivk: channel.keys.ivk, address: channel.address })
    )
  )
  return channels
})

const setLastSeen = createAction(actionTypes.SET_LAST_SEEN)
const setUnread = createAction(actionTypes.SET_UNREAD)

export const actions = {
  loadChannels,
  setLastSeen,
  setUnread
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
  return getVault().channels.importChannel(identityId, channel)
}

const createChannel = (values, formActions) => async (dispatch, getState) => {
  const closeModal = modalsHandlers.actionCreators.closeModal('createChannel')
  try {
    const identityId = identitySelectors.id(getState())
    await _createChannel(identityId, values)
    dispatch(notificationsHandlers.actions.enqueueSnackbar(
      successNotification(`Successfully created ${values.name} channel.`)
    ))
    formActions.setSubmitting(false)
    dispatch(closeModal())
    dispatch(loadChannels(identityId))
  } catch (error) {
    dispatch(notificationsHandlers.actions.enqueueSnackbar(
      errorNotification({ message: `Failed to create channel: ${error.message}` })
    ))
    formActions.setSubmitting(false)
  }
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
  updateLastSeen
}

export const reducer = handleActions({
  [typePending(actionTypes.LOAD_CHANNELS)]: state => state.setIn(['loader', 'loading'], true)
    .setIn(['loader', 'message'], 'Loading channels'),
  [typeFulfilled(actionTypes.LOAD_CHANNELS)]: (state, { payload: data }) => state
    .set('data', Immutable.fromJS(data))
    .setIn(['loader', 'loading'], false),
  [typeRejected(actionTypes.LOAD_CHANNELS)]: (state, { payload: error }) => state
    .setIn(['loader', 'loading'], false),
  [setLastSeen]: (state, { payload: { channelId, lastSeen } }) => {
    const index = state.data.findIndex(channel => channel.get('id') === channelId)
    return state.updateIn(['data', index], ch => ch.set('lastSeen', lastSeen))
  },
  [setUnread]: (state, { payload: { channelId, unread } }) => {
    const index = state.data.findIndex(channel => channel.get('id') === channelId)
    return state.updateIn(['data', index], ch => ch.set('unread', unread))
  }
}, initialState)

export default {
  actions,
  epics,
  reducer
}
