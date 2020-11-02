import { createSelector } from 'reselect'

const store = s => s

const queue = createSelector(store, state => state.directMessagesQueue)

export default {
  queue
}
