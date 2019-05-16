import Immutable from 'immutable'
import { createAction, handleActions } from 'redux-actions'

import { getClient } from '../../zcash'
import channels from '../../zcash/channels'

import identitySelectors from '../selectors/identity'
import nodeSelectors from '../selectors/node'
import channelsHandlers from './channels'
import vaultHandlers from './vault'
import nodeHandlers from './node'
import { getVault } from '../../vault'

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

// TODO: [refactoring] accept identity
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

export const createIdentity = () => async (dispatch, getState) => {
  try {
    const { value: address } = await dispatch(nodeHandlers.actions.createAddress())
    const { value: identity } = await dispatch(vaultHandlers.actions.createIdentity({
      name: 'Saturn',
      address
    }))
    const network = nodeSelectors.network(getState())
    const generalChannel = channels.general[network]
    await getVault().channels.importChannel(identity.id, generalChannel)
    await getClient().keys.importIVK({
      ivk: generalChannel.keys.ivk,
      address: generalChannel.address
    })
    return identity
  } catch (err) {
    dispatch(setErrors(err))
  }
}

export const setIdentityEpic = (identity) => async (dispatch) => {
  dispatch(setIdentity(identity))
  await Promise.all([
    dispatch(fetchBalance()),
    dispatch(channelsHandlers.actions.loadChannels(identity.id))
  ])
}

const epics = {
  fetchBalance,
  createIdentity,
  setIdentity: setIdentityEpic
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
