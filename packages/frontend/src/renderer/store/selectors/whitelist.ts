import { createSelector } from 'reselect'

import { Store } from '../reducers'

const whitelist = (s: Store) => s.whitelist

const whitelisted = createSelector(whitelist, a => a.whitelisted)
const allowAll = createSelector(whitelist, a => a.allowAll)
const autoload = createSelector(whitelist, a => a.autoload)

export default {
  whitelist,
  whitelisted,
  allowAll,
  autoload
}
