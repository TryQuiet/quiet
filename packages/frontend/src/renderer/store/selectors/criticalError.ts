import { createSelector } from 'reselect'

import { Store } from '../reducers'

const criticalError = (s: Store) => s.criticalError

const message = createSelector(criticalError, error => error.message)
const traceback = createSelector(criticalError, error => error.traceback)

export default {
  criticalError,
  message,
  traceback
}
