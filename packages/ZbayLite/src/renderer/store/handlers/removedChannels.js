import { produce } from 'immer'
import { handleActions, createAction } from 'redux-actions'

import { actionTypes } from '../../../shared/static'

export const initialState = {}
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
    [loadRemovedChannelsTimestamps]: (state, { payload }) => produce(state, (draft) => {
      return {
        ...draft,
        ...payload
      }
    })
  },
  initialState
)

export default {
  reducer,
  actions,
  epics
}
