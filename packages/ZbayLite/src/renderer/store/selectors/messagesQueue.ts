import { createSelector } from 'reselect'
import { MessagesQueueStore } from '../handlers/messagesQueue'

const store = (s): MessagesQueueStore => s.messagesQueue as MessagesQueueStore

const queue = createSelector(store, state => state)

export default {
  queue
}
