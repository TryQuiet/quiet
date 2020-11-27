import { createSelector } from 'reselect'

import { Store } from '../reducers'

const store = (s: Store) => s.messagesQueue

const queue = createSelector(store, state => state)

export default {
  queue
}
