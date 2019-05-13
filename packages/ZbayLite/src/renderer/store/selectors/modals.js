import { createSelector } from 'reselect'

const store = s => s

const modals = createSelector(store, s => s.get('modals'))

const open = name => createSelector(modals, m => m.get(name, false))

export default {
  modals,
  open
}
