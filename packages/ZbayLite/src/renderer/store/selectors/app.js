import { createSelector } from 'reselect'

const store = s => s

export const app = createSelector(store, state => state.get('app'))

const version = createSelector(app, a => a.version)
const transfers = createSelector(app, a => a.transfers)
const currentModalTab = createSelector(app, a => a.modalTabToOpen)
const allTransfersCount = createSelector(app, a => a.allTransfersCount)
const newTransfersCounter = createSelector(app, a => a.newTransfersCounter)
const isInitialLoadFinished = createSelector(app, a => a.isInitialLoadFinished)
const directMessageQueueLock = createSelector(
  app,
  a => a.directMessageQueueLock
)
const messageQueueLock = createSelector(app, a => a.messageQueueLock)

export default {
  version,
  transfers,
  currentModalTab,
  allTransfersCount,
  newTransfersCounter,
  messageQueueLock,
  directMessageQueueLock,
  isInitialLoadFinished
}
