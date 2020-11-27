import { createSelector } from 'reselect'

import { Store } from '../reducers'

const modals = (s: Store) => s.modals

const open = name => createSelector(modals, m => m[name] || false)

const payload = name => createSelector(modals, m => m.payloads[name])

export default {
  modals,
  open,
  payload
}
