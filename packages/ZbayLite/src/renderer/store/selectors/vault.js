import { createSelector } from 'reselect'

const store = s => s

const vault = createSelector(store, state => state.get('vault'))

const exists = createSelector(vault, v => v.exists)
const isLogIn = createSelector(vault, v => v.isLogIn)
const creating = createSelector(vault, v => v.creating)
const locked = createSelector(vault, v => v.locked)
const unlocking = createSelector(vault, v => v.unlocking)
const error = createSelector(vault, v => v.error)

export default {
  exists,
  creating,
  unlocking,
  error,
  locked,
  isLogIn
}
