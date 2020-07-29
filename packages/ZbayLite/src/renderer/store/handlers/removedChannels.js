import Immutable from 'immutable'
import { handleActions, createAction } from 'redux-actions'

import { actionTypes } from '../../../shared/static'

export const initialState = Immutable.Map()
export const loadRemovedChannelsTimestamps = createAction(actionTypes.LOAD_REMOVED_CHANNELS_TIMESTAMP)
export const actions = {
  loadRemovedChannelsTimestamps
}
export const getRemovedChannelsTimestamp = () => async (dispatch, getState) => {
}
export const epics = {
  getRemovedChannelsTimestamp
}

export const reducer = handleActions(
  {
    [loadRemovedChannelsTimestamps]: (state, { payload }) => state.merge(payload)
  },
  initialState
)

export default {
  reducer,
  actions,
  epics
}
