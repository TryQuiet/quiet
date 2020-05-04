import { createSelector } from 'reselect'

const store = s => s

export const app = createSelector(store, state => state.get('app'))

const version = createSelector(app, a => a.version)
const transfers = createSelector(app, a => a.transfers)
const currentModalTab = createSelector(app, a => a.modalTabToOpen)
const allTransfersCount = createSelector(app, a => a.allTransfersCount)
const newTransfersCounter = createSelector(app, a => a.newTransfersCounter)

export default {
  version,
  transfers,
  currentModalTab,
  allTransfersCount,
  newTransfersCounter
}
