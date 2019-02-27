import { createSelector } from 'reselect'

const store = s => s

const unlocker = createSelector(store, state => state.get('vaultUnlocker'))

const passwordVisible = createSelector(unlocker, v => v.passwordVisible)

const password = createSelector(unlocker, v => v.password)

export default {
  unlocker,
  passwordVisible,
  password
}
