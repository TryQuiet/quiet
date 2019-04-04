import Immutable from 'immutable'
import { createAction, handleActions } from 'redux-actions'

import { typeFulfilled, typeRejected, typePending } from './utils'

import vault from '../../vault'

export const VaultState = Immutable.Record({
  exists: false,
  creating: false,
  unlocking: false,
  creatingIdentity: false,
  locked: true,
  error: ''
}, 'VaultState')

export const initialState = VaultState({
  exists: vault.exists()
})

export const actionTypes = {
  CREATE: 'CREATE_VAULT',
  UNLOCK: 'UNLOCK_VAULT',
  CREATE_IDENTITY: 'CREATE_VAULT_IDENTITY',
  CLEAR_ERROR: 'CLEAR_VAULT_ERROR'
}

const createVault = createAction(actionTypes.CREATE, vault.create)
const unlockVault = createAction(actionTypes.UNLOCK, vault.unlock)
const createIdentity = createAction(actionTypes.CREATE_IDENTITY, vault.identity.createIdentity)
const clearError = createAction(actionTypes.CLEAR_ERROR)

export const actions = {
  createIdentity,
  createVault,
  unlockVault,
  clearError
}

export const reducer = handleActions({
  [typePending(actionTypes.CREATE)]: state => state.set('creating', true),
  [typeFulfilled(actionTypes.CREATE)]: state => state.merge({
    creating: false,
    exists: true
  }),
  [typeRejected(actionTypes.CREATE)]: (state, { payload: error }) => state.merge({
    creating: false,
    error: error.message
  }),

  [typePending(actionTypes.UNLOCK)]: state => state.set('unlocking', true),
  [typeFulfilled(actionTypes.UNLOCK)]: (state, payload) => state.merge({
    unlocking: false,
    locked: false
  }),
  [typeRejected(actionTypes.UNLOCK)]: (state, { payload: error }) => state.merge({
    unlocking: false,
    locked: true,
    error: error.message
  }),

  [typePending(actionTypes.CREATE_IDENTITY)]: state => state.set('creatingIdentity', true),
  [typeFulfilled(actionTypes.CREATE_IDENTITY)]: state => state.set('creatingIdentity', false),
  [typeRejected(actionTypes.CREATE_IDENTITY)]: (state, { payload: error }) => state.merge({
    creatingIdentity: false,
    error: error.message
  }),

  [clearError]: state => state.delete('error')
}, initialState)

export default {
  actions,
  reducer
}
