import Immutable from 'immutable'
import { createAction, handleActions } from 'redux-actions'

import { typeFulfilled, typeRejected, typePending } from './utils'

import { getVault } from '../../vault'

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
  reducer
}
