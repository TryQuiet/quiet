import Immutable from 'immutable'
import { createAction, handleActions } from 'redux-actions'
import crypto from 'crypto'
import { ipcRenderer } from 'electron'
import axios from 'axios'

import { typeFulfilled, typeRejected, typePending, errorNotification } from './utils'
// import nodeSelectors from '../selectors/node'
import identityHandlers from './identity'
// import vaultHandlers from './vault'
import notificationsHandlers from './notifications'
import logsHandlers from '../handlers/logs'
import { REQUEST_MONEY_ENDPOINT, actionTypes } from '../../../shared/static'
import electronStore from '../../../shared/electronStore'
// import passwordMigration from '../../../shared/migrations/1_40_0'

export const VaultState = Immutable.Record({
  exists: null,
  creating: false,
  unlocking: false,
  creatingIdentity: false,
  locked: true,
  isLogIn: false,
  error: ''
}, 'VaultState')

export const initialState = VaultState()

const createVault = createAction(actionTypes.CREATE_VAULT)
const unlockVault = createAction(
  actionTypes.UNLOCK_VAULT,
  ({ ignoreError = false }) => ({ ignoreError })
)
const createIdentity = createAction(actionTypes.CREATE_VAULT_IDENTITY)
const updateIdentitySignerKeys = createAction(actionTypes.UPDATE_IDENTITY_SIGNER_KEYS)
const clearError = createAction(actionTypes.CLEAR_VAULT_ERROR)
const setVaultStatus = createAction(actionTypes.SET_VAULT_STATUS)
const setLoginSuccessfull = createAction(actionTypes.SET_LOGIN_SUCCESSFULL)

export const actions = {
  createIdentity,
  updateIdentitySignerKeys,
  createVault,
  unlockVault,
  setVaultStatus,
  clearError,
  setLoginSuccessfull
}

const loadVaultStatus = () => async (dispatch, getState) => {
  await dispatch(setVaultStatus(true))
}

const createVaultEpic = () => async (dispatch, getState) => {
  const randomBytes = crypto.randomBytes(32).toString('hex')
  try {
    electronStore.set('isNewUser', true)
    dispatch(logsHandlers.epics.saveLogs({ type: 'APPLICATION_LOGS', payload: `Setting user status: 'new'` }))
    electronStore.set('vaultPassword', randomBytes)
    const identity = await dispatch(identityHandlers.epics.createIdentity({ name: randomBytes }))
    console.log('identity', identity)
    axios.get(REQUEST_MONEY_ENDPOINT, {
      params: {
        address: identity.address
      }
    })
    const isDev = process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test'
    if (isDev) {
      await dispatch(identityHandlers.epics.setIdentity(identity))
    }
    await dispatch(identityHandlers.epics.loadIdentity(identity))
    await dispatch(setVaultStatus(true))
    ipcRenderer.send('vault-created')
    return identity
  } catch (error) {
    dispatch(notificationsHandlers.actions.enqueueSnackbar(
      errorNotification({ message: `Failed to create vault: ${error.message}` })
    ))
  }
}
export const setVaultIdentity = () => async (dispatch, getState) => {
  try {
    const identity = electronStore.get('identity')
    await dispatch(identityHandlers.epics.setIdentity(identity))
  } catch (err) {
    console.log(err)
  }
}
const unlockVaultEpic = ({ password: masterPassword }, formActions, setDone) => async (dispatch, getState) => {
  await dispatch(setLoginSuccessfull(false))
  setDone(false)
  const identity = electronStore.get('identity')
  if (!identity) {
    await dispatch(createVaultEpic())
  } else {
    await dispatch(setVaultIdentity())
  }
  await dispatch(setLoginSuccessfull(true))
  formActions.setSubmitting(false)
  setDone(true)
  // // const state = getState()
  // // const network = nodeSelectors.network(state)
  // // const vaultPassword = electronStore.get('vaultPassword')
  // try {
  //   if (!vaultPassword && !masterPassword) {
  //     // await dispatch(createVaultEpic())
  //     await dispatch(setLoginSuccessfull(true))
  //     formActions.setSubmitting(false)
  //   } else {
  //     // await dispatch(vaultHandlers.actions.unlockVault({ masterPassword: vaultPassword || masterPassword, network, ignoreError: true }))
  //     await dispatch(setLoginSuccessfull(true))
  //     // if (!vaultPassword) {
  //     //   passwordMigration.storePassword(masterPassword)
  //     // }
  //     formActions.setSubmitting(false)
  //   }
  // } catch (error) {
  //   if (error.message.includes('Authentication failed')) {
  //     dispatch(notificationsHandlers.actions.enqueueSnackbar(
  //       errorNotification({ message: 'Incorrect password' }, { persist: false })
  //     ))
  //     setDone(true)
  //   } else {
  //     throw error
  //   }
  // }
}

export const epics = {
  loadVaultStatus,
  setVaultIdentity,
  createVault: createVaultEpic,
  unlockVault: unlockVaultEpic
}

export const reducer = handleActions({
  [typePending(actionTypes.CREATE_VAULT)]: state => state.set('creating', true),
  [typeFulfilled(actionTypes.CREATE_VAULT)]: state => state.merge({
    creating: false,
    exists: true
  }),
  [typeRejected(actionTypes.CREATE_VAULT)]: (state, { payload: error }) => state.merge({
    creating: false,
    error: error.message
  }),

  [typePending(actionTypes.UNLOCK_VAULT)]: state => state.set('unlocking', true),
  [typeFulfilled(actionTypes.UNLOCK_VAULT)]: (state, payload) => state.merge({
    unlocking: false,
    locked: false
  }),
  [typeRejected(actionTypes.UNLOCK_VAULT)]: (state, { payload: error }) => state.merge({
    unlocking: false,
    locked: true,
    error: error.message
  }),

  [typePending(actionTypes.CREATE_VAULT_IDENTITY)]: state => state.set('creatingIdentity', true),
  [typeFulfilled(actionTypes.CREATE_VAULT_IDENTITY)]: state => state.set('creatingIdentity', false),
  [typeRejected(actionTypes.CREATE_VAULT_IDENTITY)]: (state, { payload: error }) => state.merge({
    creatingIdentity: false,
    error: error.message
  }),
  [setLoginSuccessfull]: (state, { payload: isLogIn }) => state.set('isLogIn', isLogIn),
  [setVaultStatus]: (state, { payload: exists }) => state.set('exists', exists),
  [clearError]: state => state.delete('error')
}, initialState)

export default {
  actions,
  epics,
  reducer
}
