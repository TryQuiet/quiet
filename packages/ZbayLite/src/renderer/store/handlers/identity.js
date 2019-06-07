import Immutable from 'immutable'
import { createAction, handleActions } from 'redux-actions'

import { getClient } from '../../zcash'
import channels from '../../zcash/channels'

import identitySelectors from '../selectors/identity'
import nodeSelectors from '../selectors/node'
import channelsHandlers from './channels'
import operationHandlers, { operationTypes, ShieldBalanceOp } from './operations'
import vaultHandlers from './vault'
import nodeHandlers from './node'
import { getVault } from '../../vault'

export const Identity = Immutable.Record({
  id: null,
  address: '',
  transparentAddress: '',
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

export const shieldBalance = ({ from, to, amount, fee }) => async (dispatch, getState) => {
  const opId = await getClient().payment.send({
    from,
    amounts: [{
      address: to,
      amount: amount.toString()
    }],
    fee
  })
  dispatch(
    operationHandlers.epics.observeOperation({
      opId,
      type: operationTypes.shieldBalance,
      meta: ShieldBalanceOp({
        amount,
        from,
        to
      })
    })
  )
}

// TODO: [refactoring] accept identity
export const fetchBalance = () => async (dispatch, getState) => {
  const fee = 0.0001
  dispatch(setFetchingBalance(true))
  const address = identitySelectors.address(getState())
  const tAddress = identitySelectors.transparentAddress(getState())
  try {
    const balance = await getClient().accounting.balance(address)
    const transparentBalance = await getClient().accounting.balance(tAddress)
    const realTBalance = transparentBalance.minus(fee)
    // TODO: test adds operation
    if (realTBalance.gt(0)) {
      await dispatch(shieldBalance({
        from: tAddress,
        to: address,
        amount: realTBalance,
        fee
      }))
    }
    dispatch(setBalance(balance))
  } catch (err) {
    dispatch(setErrors(err.message))
  } finally {
    dispatch(setFetchingBalance(false))
  }
}

export const createIdentity = ({ name }) => async (dispatch, getState) => {
  try {
    const { value: address } = await dispatch(nodeHandlers.actions.createAddress())
    const transparentAddress = await getClient().addresses.createTransparent()
    const { value: identity } = await dispatch(vaultHandlers.actions.createIdentity({
      name,
      address,
      transparentAddress
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
  [setIdentity]: (state, { payload: identity }) => state.update(
    'data',
    data => data.merge(identity)
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
