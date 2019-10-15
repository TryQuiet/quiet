import { createSelector } from 'reselect'

const store = s => s

const modals = createSelector(store, s => s.get('modals'))

const open = name => createSelector(modals, m => m.get(name, false))

const payload = createSelector(modals, m => m.get('payload', null))

export default {
  modals,
  open,
  payload
}
