import { createSelector } from 'reselect'
import { operationTypes } from '../handlers/operations'

const store = s => s

const operations = createSelector(store, state => state.get('operations'))

const pendingMessages = createSelector(
  operations,
  ops => ops.filter(o => o.type === operationTypes.pendingMessage)
)

export default {
  operations,
  pendingMessages
}
