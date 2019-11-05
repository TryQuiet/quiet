import { createSelector } from 'reselect'
import Immutable from 'immutable'

const store = s => s

const messages = createSelector(
  store,
  state => state.get('messages')
)
const currentChannelMessages = channelId =>
  createSelector(
    messages,
    msgs => msgs.getIn([channelId, 'messages'], Immutable.List())
  )
const allMessages = createSelector(
  messages,
  msgs =>
    Immutable.List(msgs.keySeq()).reduce((acc, channelId) => {
      return acc.concat(msgs.getIn([channelId, 'messages']))
    }, Immutable.List())
)
const messageById = id =>
  createSelector(
    allMessages,
    msgs => {
      return msgs.find(message => message.id === id)
    }
  )

export default {
  messages,
  currentChannelMessages,
  messageById,
  allMessages
}
