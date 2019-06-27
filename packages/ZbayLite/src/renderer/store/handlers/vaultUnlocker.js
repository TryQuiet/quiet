import Immutable from 'immutable'
import { createAction, handleActions } from 'redux-actions'

import vault from '../../vault'
import vaultHandlers from './vault'
import identityHandlers from './identity'
import vaultUnlockerSelectors from '../selectors/vaultUnlocker'
import nodeSelectors from '../selectors/node'

export const VaultUnlockerState = Immutable.Record({
  password: '',
  passwordVisible: false
}, 'VaultUnlockerState')

const initialState = VaultUnlockerState({
  password: '',
  passwordVisible: false
})

const setPassword = createAction('SET_UNLOCKER_PASSWORD', e => e.target.value)
const togglePasswordVisibility = createAction('TOGGLE_UNLOCKER_PASSWORD')
const clearUnlocker = createAction('CLEAR_UNLOCKER')

const unlockVault = () => async (dispatch, getState) => {
  const state = getState()
  const network = nodeSelectors.network(state)
  const masterPassword = vaultUnlockerSelectors.password(state)
  await dispatch(vaultHandlers.actions.unlockVault({ masterPassword, network }))
  const [identity] = await vault.identity.listIdentities()
  await dispatch(identityHandlers.epics.setIdentity(identity))
  await dispatch(clearUnlocker())
}

const reducer = handleActions({
  [togglePasswordVisibility]: state => state.set(
    'passwordVisible',
    !state.passwordVisible
  ),
  [setPassword]: (state, { payload: password }) => state.set('password', password),
  [clearUnlocker]: state => state.clear()
}, initialState)

export const actions = {
  togglePasswordVisibility,
  clearUnlocker,
  setPassword
}

export const epics = {
  unlockVault
}

export default {
  actions,
  epics,
  reducer
}
