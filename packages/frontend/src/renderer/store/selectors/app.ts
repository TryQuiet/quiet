import { createSelector } from 'reselect'

import { Store } from '../reducers'

const app = (s: Store) => s.app

const version = createSelector(app, (a) => a.version)
const currentModalTab = createSelector(app, (a) => a.modalTabToOpen)
const isInitialLoadFinished = createSelector(
  app,
  (a) => a.isInitialLoadFinished
)

export default {
  version,
  currentModalTab,
  isInitialLoadFinished
}
