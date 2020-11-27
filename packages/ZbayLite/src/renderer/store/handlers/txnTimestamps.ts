import { produce } from 'immer'
import { handleActions, createAction } from 'redux-actions'

import { ActionsType, PayloadType } from './types'

import { actionTypes } from '../../../shared/static'

interface ITxnTimestamps {
  [id: number]: string
}

export const initialState: ITxnTimestamps = {}
export const addTxnTimestamp = createAction<{
  tnxs: {
    [id: number]: string
  }
}>(actionTypes.ADD_TXN_TIMESTAMP)

export const actions = {
  addTxnTimestamp
}

export type TxnTimestampsActions = ActionsType<typeof actions>

export const reducer = handleActions<ITxnTimestamps, PayloadType<TxnTimestampsActions>>(
  {
    [addTxnTimestamp.toString()]: (
      state,
      { payload: { tnxs } }: TxnTimestampsActions['addTxnTimestamp']
    ) =>
      produce(state, draft => {
        return {
          ...draft,
          ...tnxs
        }
      })
  },
  initialState
)

export default {
  reducer,
  actions,
}
