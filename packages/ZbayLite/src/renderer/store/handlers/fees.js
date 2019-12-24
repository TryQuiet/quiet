import Immutable from 'immutable'
import { createAction, handleActions } from 'redux-actions'

export const Fee = Immutable.Record(
  {
    user: 0.0001,
    publicChannel: 0.0001
  },
  'Fee'
)

export const initialState = Fee()

const setUserFee = createAction('SET_USER_FEE')
const setPublicChannelFee = createAction('SET_PYBLIC_CHANNEL_FEE')

export const actions = {
  setUserFee,
  setPublicChannelFee
}

export const reducer = handleActions(
  {
    [setUserFee]: (state, { payload: fee }) => state.setIn(['user'], fee),
    [setPublicChannelFee]: (state, { payload: fee }) =>
      state.setIn(['publicChannel'], fee)
  },
  initialState
)

export default {
  actions,
  reducer
}
