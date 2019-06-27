import { createSelector } from 'reselect'

const store = s => s

const criticalError = createSelector(store, state => state.get('criticalError'))

const message = createSelector(criticalError, error => error.message)
const traceback = createSelector(criticalError, error => error.traceback)

export default {
  criticalError,
  message,
  traceback
}
