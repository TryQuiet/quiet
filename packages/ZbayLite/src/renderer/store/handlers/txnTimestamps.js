import Immutable from 'immutable'
import { handleActions, createAction } from 'redux-actions'

import { getVault } from '../../vault'
import { actionTypes } from '../../../shared/static'

export const initialState = Immutable.Map()
export const addTxnTimestamp = createAction(actionTypes.ADD_TXN_TIMESTAMP)
export const actions = {
  addTxnTimestamp
}
export const getTnxTimestamps = () => async (dispatch, getState) => {
  const transactionsTimestamps = await getVault().transactionsTimestamps.listTransactions()
  const tnxs = transactionsTimestamps.reduce((map, obj) => {
    return map.merge(obj)
  }, new Immutable.Map())
  await dispatch(addTxnTimestamp({ tnxs }))
}
export const epics = {
  getTnxTimestamps
}

export const reducer = handleActions(
  {
    [addTxnTimestamp]: (state, { payload: { tnxs } }) => state.merge(tnxs)
  },
  initialState
)

export default {
  reducer,
  actions,
  epics
}
