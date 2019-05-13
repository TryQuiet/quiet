import Immutable from 'immutable'
import { createAction, handleActions } from 'redux-actions'

import {
  typeFulfilled,
  typeRejected,
  typePending,
  errorNotification,
  successNotification
} from './utils'
import notificationsHandlers from './notifications'
import identitySelectors from '../selectors/identity'
import modalsHandlers from './modals'

import { getVault } from '../../vault'
import { getClient } from '../../zcash'

export const ChannelsState = Immutable.Record({
  data: Immutable.List(),
  loading: false,
  errors: ''
}, 'ChannelsState')

export const initialState = ChannelsState()

export const actionTypes = {
  LOAD_CHANNELS: 'LOAD_IDENTITY_CHANNELS'
}

const loadChannels = createAction(actionTypes.LOAD_CHANNELS, async (id) => {
  return getVault().channels.listChannels(id)
})

export const actions = {
  loadChannels
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

export const epics = {
  createChannel
}

export const reducer = handleActions({
  [typePending(actionTypes.LOAD_CHANNELS)]: state => state.set('loading', true),
  [typeFulfilled(actionTypes.LOAD_CHANNELS)]: (state, { payload: data }) => state
    .set('data', Immutable.fromJS(data))
    .set('loading', false),
  [typeRejected(actionTypes.LOAD_CHANNELS)]: (state, { payload: error }) => state
    .set('loading', false)
    .set('errors', error.message)
}, initialState)

export default {
  actions,
  epics,
  reducer
}
