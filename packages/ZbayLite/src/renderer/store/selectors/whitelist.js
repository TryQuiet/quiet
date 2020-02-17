import { createSelector } from 'reselect'

const store = s => s

export const whitelist = createSelector(store, state => state.get('whitelist'))

const whitelisted = createSelector(whitelist, a => a.whitelisted)
const allowAll = createSelector(whitelist, a => a.allowAll)
const autoload = createSelector(whitelist, a => a.autoload)

export default {
  whitelist,
  whitelisted,
  allowAll,
  autoload
}
