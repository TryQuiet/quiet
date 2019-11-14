import { createSelector } from 'reselect'

const store = s => s

export const app = createSelector(store, state => state.get('app'))

const version = createSelector(app, a => a.version)
const transfers = createSelector(app, a => a.transfers)
const newUser = createSelector(app, a => a.newUser)
const currentModalTab = createSelector(app, a => a.modalTabToOpen)

export default {
  version,
  transfers,
  newUser,
  currentModalTab
}
