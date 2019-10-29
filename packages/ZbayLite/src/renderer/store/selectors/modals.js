import { createSelector } from 'reselect'

const store = s => s

const modals = createSelector(store, s => s.get('modals'))

const open = name => createSelector(modals, m => m.get(name, false))

const payload = name => createSelector(modals, m => m.getIn(['payloads', name]))

export default {
  modals,
  open,
  payload
}
