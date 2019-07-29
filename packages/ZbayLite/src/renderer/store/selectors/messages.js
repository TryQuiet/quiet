import { createSelector } from 'reselect'
import Immutable from 'immutable'

const store = s => s

const messages = createSelector(store, state => state.get('messages'))
const currentChannelMessages = channelId => createSelector(
  messages,
  msgs => msgs.getIn([channelId, 'messages'], Immutable.List())
)

export default {
  messages,
  currentChannelMessages
}
