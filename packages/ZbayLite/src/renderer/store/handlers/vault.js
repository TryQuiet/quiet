import Immutable from 'immutable'
import { createAction, handleActions } from 'redux-actions'

import { typeFulfilled, typeRejected, typePending, errorNotification } from './utils'
import nodeSelectors from '../selectors/node'
import identityHandlers from './identity'
import vaultHandlers from './vault'
import notificationsHandlers from './notifications'
import appHandlers from './app'

import vault from '../../vault'

export const VaultState = Immutable.Record({
  exists: false,
  creating: false,
  unlocking: false,
  creatingIdentity: false,
  locked: true,
  error: ''
}, 'VaultState')

export const initialState = VaultState()

export const actionTypes = {
  CREATE: 'CREATE_VAULT',
  UPDATE_IDENTITY_SIGNER_KEYS: 'UPDATE_IDENTITY_SIGNER_KEYS',
  SET_STATUS: 'SET_VAULT_STATUS',
  UNLOCK: 'UNLOCK_VAULT',
  CREATE_IDENTITY: 'CREATE_VAULT_IDENTITY',
  CLEAR_ERROR: 'CLEAR_VAULT_ERROR'
}

const createVault = createAction(actionTypes.CREATE, vault.create)
const unlockVault = createAction(
  actionTypes.UNLOCK,
  vault.unlock,
  ({ ignoreError = false }) => ({ ignoreError })
)
const createIdentity = createAction(actionTypes.CREATE_IDENTITY, vault.identity.createIdentity)
const updateIdentitySignerKeys = createAction(actionTypes.UPDATE_IDENTITY_SIGNER_KEYS, vault.identity.updateIdentitySignerKeys)
const clearError = createAction(actionTypes.CLEAR_ERROR)
const setVaultStatus = createAction(actionTypes.SET_STATUS)

export const actions = {
  createIdentity,
  updateIdentitySignerKeys,
  createVault,
  unlockVault,
  setVaultStatus,
  clearError
}

const loadVaultStatus = () => (dispatch, getState) => {
  const network = nodeSelectors.network(getState())
  return dispatch(setVaultStatus(vault.exists(network)))
}

const createVaultEpic = ({ name, password }, formActions) => async (dispatch, getState) => {
  const network = nodeSelectors.network(getState())
  try {
    await dispatch(appHandlers.actions.setNewUser(true))
    await dispatch(createVault({ masterPassword: password, network }))
    await dispatch(actions.unlockVault({
      masterPassword: password,
      createSource: true,
      network
    }))
    const identity = await dispatch(identityHandlers.epics.createIdentity({ name }))
    await dispatch(identityHandlers.epics.setIdentity(identity))
    await dispatch(setVaultStatus(true))
  } catch (error) {
    dispatch(notificationsHandlers.actions.enqueueSnackbar(
      errorNotification({ message: `Failed to create vault: ${error.message}` })
    ))
  }
  formActions.setSubmitting(false)
}

const unlockVaultEpic = ({ password: masterPassword }, formActions) => async (dispatch, getState) => {
  const state = getState()
  const network = nodeSelectors.network(state)
  try {
    await dispatch(vaultHandlers.actions.unlockVault({ masterPassword, network, ignoreError: true }))
    const [identity] = await vault.identity.listIdentities()
    await dispatch(identityHandlers.epics.setIdentity(identity))
  } catch (error) {
    if (error.message.includes('Authentication failed')) {
      dispatch(notificationsHandlers.actions.enqueueSnackbar(
        errorNotification({ message: 'Incorrect password' }, { persist: false })
      ))
    } else {
      throw error
    }
  }
  formActions.setSubmitting(false)
}

export const epics = {
  loadVaultStatus,
  createVault: createVaultEpic,
  unlockVault: unlockVaultEpic
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
  [setVaultStatus]: (state, { payload: exists }) => state.set('exists', exists),
  [clearError]: state => state.delete('error')
}, initialState)

export default {
  actions,
  epics,
  reducer
}
