import { createSelector } from 'reselect'

import { Store } from '../reducers'

const vault = (s: Store) => s.vault

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
