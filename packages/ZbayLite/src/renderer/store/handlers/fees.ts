import { produce, immerable } from 'immer'
import { createAction, handleActions } from 'redux-actions'
import { actionTypes } from '../../../shared/static'

import { ActionsType, PayloadType } from './types'

class Fees {
  user: number
  publicChannel: number

  constructor(values?: Partial<Fees>) {
    Object.assign(this, values)
    this[immerable] = true
  }
}

export const initialState: Fees = new Fees({ user: 0.0001, publicChannel: 0.0001 })


const setUserFee = createAction<number>(actionTypes.SET_USER_FEE)
const setPublicChannelFee = createAction<number>(actionTypes.SET_PUBLIC_CHANNEL_FEE)

export const actions = {
  setUserFee,
  setPublicChannelFee
}

export type FeesActions = ActionsType<typeof actions>

export const reducer = handleActions<Fees, PayloadType<FeesActions>>(
  {
    [setUserFee.toString()]: (state, { payload: fee }: FeesActions['setUserFee']) =>
      produce(state, draft => {
        draft.user = fee
      }),
    [setPublicChannelFee.toString()]: (
      state,
      { payload: fee }: FeesActions['setPublicChannelFee']
    ) =>
      produce(state, draft => {
        draft.publicChannel = fee
      })
  },
  initialState
)

export default {
  actions,
  reducer
}
