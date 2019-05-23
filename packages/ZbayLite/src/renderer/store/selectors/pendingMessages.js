import { createSelector } from 'reselect'

const store = s => s

const pendingMessages = createSelector(store, state => state.get('pendingMessages'))

export default {
  pendingMessages
}
