import { createSelector } from 'reselect'

const store = s => s

const unlocker = createSelector(store, state => state.get('vaultUnlocker'))
const passwordVisible = createSelector(unlocker, v => v.passwordVisible)
const password = createSelector(unlocker, v => v.password)
const unlocking = createSelector(unlocker, v => v.unlocking)

export default {
  unlocking,
  unlocker,
  passwordVisible,
  password
}
