import { createSelector } from 'reselect'

const store = s => s

const modals = createSelector(store, s => s.modals)

const open = name => createSelector(modals, m => m[name] || false)

const payload = name => createSelector(modals, m => m.payloads[name])

export default {
  modals,
  open,
  payload
}
