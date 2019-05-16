import { createSelector } from 'reselect'

const store = s => s

const vault = createSelector(store, state => state.get('vault'))

const exists = createSelector(vault, v => v.exists)
const creating = createSelector(vault, v => v.creating)
// TODO: 14/05 this should be checked on vault, not in redux
const locked = createSelector(vault, v => v.locked)
const unlocking = createSelector(vault, v => v.unlocking)
const error = createSelector(vault, v => v.error)

export default {
  exists,
  creating,
  unlocking,
  error,
  locked
}
