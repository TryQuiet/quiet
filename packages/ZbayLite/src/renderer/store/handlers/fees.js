import { produce } from 'immer'
import { createAction, handleActions } from 'redux-actions'
import { actionTypes } from '../../../shared/static'

export const Fee = {
  user: 0.0001,
  publicChannel: 0.0001
}

export const initialState = {
  ...Fee
}

const setUserFee = createAction(actionTypes.SET_USER_FEE)
const setPublicChannelFee = createAction(actionTypes.SET_PUBLIC_CHANNEL_FEE)

export const actions = {
  setUserFee,
  setPublicChannelFee
}

export const reducer = handleActions(
  {
    [setUserFee]: (state, { payload: fee }) => produce(state, (draft) => {
      draft.user = fee
    }),
    [setPublicChannelFee]: (state, { payload: fee }) =>
      produce(state, (draft) => {
        draft.publicChannel = fee
      })
  },
  initialState
)

export default {
  actions,
  reducer
}
