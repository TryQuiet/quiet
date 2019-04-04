import Immutable from 'immutable'
import { createAction, handleActions } from 'redux-actions'

import { getClient } from '../../zcash'

import identitySelectors from '../selectors/identity'

export const Identity = Immutable.Record({
  id: null,
  address: '',
  name: '',
  balance: null
}, 'Identity')

export const IdentityState = Immutable.Record({
  data: Identity(),
  fetchingBalance: false,
  errors: ''
}, 'IdentityState')

export const initialState = IdentityState()

export const setIdentity = createAction('SET_IDENTITY')
export const setBalance = createAction('SET_IDENTITY_BALANCE')
export const setErrors = createAction('SET_IDENTITY_ERROR')
export const setFetchingBalance = createAction('SET_FETCHING_BALANCE')

const actions = {
  setIdentity,
  setFetchingBalance,
  setErrors,
  setBalance
}

export const fetchBalance = () => async (dispatch, getState) => {
  dispatch(setFetchingBalance(true))
  const address = identitySelectors.address(getState())
  try {
    const balance = await getClient().accounting.balance(address)
    dispatch(setBalance(balance))
  } catch (err) {
    dispatch(setErrors(err.message))
  } finally {
    dispatch(setFetchingBalance(false))
  }
}

const epics = {
  fetchBalance
}

export const reducer = handleActions({
  [setIdentity]: (state, { payload: { address, name, id } }) => state.update(
    'data',
    data => data.merge({ name, id, address })
  ),
  [setBalance]: (state, { payload: balance }) => state.update(
    'data',
    data => data.set('balance', balance)
  ),
  [setFetchingBalance]: (state, { payload: fetching }) => state.set('fetchingBalance', fetching),
  [setErrors]: (state, { payload: errors }) => state.set('errors', errors)
}, initialState)

export default {
  actions,
  epics,
  reducer
}
