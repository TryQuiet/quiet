import { produce, immerable } from 'immer'
import { createAction, handleActions } from 'redux-actions'
import crypto from 'crypto'
import { ipcRenderer } from 'electron'

import { typeFulfilled, typeRejected, typePending, errorNotification } from './utils'
import identityHandlers from './identity'
import notificationsHandlers from './notifications'
import nodeHandlers from './node'
import { actionTypes } from '../../../shared/static'
import electronStore from '../../../shared/electronStore'

import { ActionsType, PayloadType } from './types'

export const VaultState = {
  exists: null,
  creating: false,
  unlocking: false,
  creatingIdentity: false,
  locked: true,
  isLogIn: false,
  error: ''
}

class Vault {
  exists?: boolean
  creating: boolean
  unlocking: boolean
  creatingIdentity: boolean
  locked: boolean
  isLogIn: boolean
  error: string

  constructor(values?: Partial<Vault>) {
    Object.assign(this, values)
    this[immerable] = true
  }
}

export const initialState = {
  ...new Vault({
    exists: null,
    creating: false,
    unlocking: false,
    creatingIdentity: false,
    locked: true,
    isLogIn: false,
    error: ''
  })
}

const createVault = createAction<{ message: string }>(actionTypes.CREATE_VAULT)
const createIdentity = createAction<{ error: string }>(actionTypes.CREATE_VAULT_IDENTITY)
const updateIdentitySignerKeys = createAction(actionTypes.UPDATE_IDENTITY_SIGNER_KEYS)
const clearError = createAction(actionTypes.CLEAR_VAULT_ERROR)
const setVaultStatus = createAction<boolean>(actionTypes.SET_VAULT_STATUS)
const setLoginSuccessfull = createAction<boolean>(actionTypes.SET_LOGIN_SUCCESSFULL)

export const actions = {
  createIdentity,
  updateIdentitySignerKeys,
  createVault,
  setVaultStatus,
  clearError,
  setLoginSuccessfull
}

export type VaultActions = ActionsType<typeof actions>

const loadVaultStatus = () => async dispatch => {
  await dispatch(setVaultStatus(true))
}

const createVaultEpic = (fromMigrationFile = false) => async dispatch => {
  const randomBytes = crypto.randomBytes(32).toString('hex')
  try {
    electronStore.set('isNewUser', true)
    electronStore.set('vaultPassword', randomBytes)
    const identity = await dispatch(
      identityHandlers.epics.createIdentity({
        name: randomBytes,
        fromMigrationFile
      })
    )
    await dispatch(nodeHandlers.actions.setIsRescanning(true))
    await dispatch(identityHandlers.epics.setIdentity(identity))
    await dispatch(identityHandlers.epics.loadIdentity())
    await dispatch(setVaultStatus(true))
    ipcRenderer.send('vault-created')
    return identity
  } catch (error) {
    dispatch(
      notificationsHandlers.actions.enqueueSnackbar(
        errorNotification({
          message: `Failed to create vault: ${error.message}`
        })
      )
    )
  }
}
export const setVaultIdentity = () => async dispatch => {
  try {
    const identity = electronStore.get('identity')
    await dispatch(identityHandlers.epics.setIdentity(identity))
  } catch (err) {
    console.log(err)
  }
}

const unlockVaultEpic = (setDone) => async dispatch => {
  await dispatch(setLoginSuccessfull(false))
  setDone(false)
  const identity = electronStore.get('identity')
  if (!identity) {
    await dispatch(createVaultEpic())
  } else {
    await dispatch(setVaultIdentity())
  }

  await dispatch(setLoginSuccessfull(true))
  setDone(true)
}

export const epics = {
  loadVaultStatus,
  setVaultIdentity,
  unlockVault: unlockVaultEpic
}

export const reducer = handleActions<Vault, PayloadType<VaultActions>>(
  {
    [typePending(actionTypes.CREATE_VAULT)]: state =>
      produce(state, draft => {
        draft.creating = true
      }),
    [typeFulfilled(actionTypes.CREATE_VAULT)]: state =>
      produce(state, draft => {
        draft.creating = false
        draft.exists = true
      }),
    [typeRejected(actionTypes.CREATE_VAULT)]: (
      state,
      { payload: error }: VaultActions['createVault']
    ) =>
      produce(state, draft => {
        draft.creating = false
        draft.error = error.message
      }),
    [typePending(actionTypes.UNLOCK_VAULT)]: state =>
      produce(state, draft => {
        draft.unlocking = true
      }),
    [typeFulfilled(actionTypes.UNLOCK_VAULT)]: state =>
      produce(state, draft => {
        draft.unlocking = false
        draft.locked = false
      }),
    [typePending(actionTypes.CREATE_VAULT_IDENTITY)]: state =>
      produce(state, draft => {
        draft.creatingIdentity = true
      }),
    [typeFulfilled(actionTypes.CREATE_VAULT_IDENTITY)]: state =>
      produce(state, draft => {
        draft.creatingIdentity = false
      }),
    [typeRejected(actionTypes.CREATE_VAULT_IDENTITY)]: (
      state,
      { payload: error }: VaultActions['createVault']
    ) =>
      produce(state, draft => {
        draft.creatingIdentity = false
        draft.error = error.message
      }),
    [setLoginSuccessfull.toString()]: (
      state,
      { payload: isLogIn }: VaultActions['setLoginSuccessfull']
    ) =>
      produce(state, draft => {
        draft.isLogIn = isLogIn
      }),
    [setVaultStatus.toString()]: (state, { payload: exists }: VaultActions['setVaultStatus']) =>
      produce(state, draft => {
        draft.exists = exists
      }),
    [clearError.toString()]: state =>
      produce(state, draft => {
        draft.error = ''
      })
  },
  initialState
)

export default {
  actions,
  epics,
  reducer
}
