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

const channelSettingsMessages = channelId => createSelector(
  messages,
  msgs => msgs.getIn([channelId, 'messages'], Immutable.List()).filter(msg => msg.get('type') === 6)
)

const channelOwner = channelId => createSelector(
  channelSettingsMessages(channelId),
  msgs => {
    let channelOwner = null
    channelOwner = msgs.get(0) ? msgs.get(0).get('publicKey') : null
    for (const msg of msgs) {
      if (channelOwner === msg.get('publicKey')) {
        channelOwner = msg.getIn(['message', 'owner'])
      }
    }
    return channelOwner
  }
)

export default {
  messages,
  channelOwner,
  channelSettingsMessages,
  currentChannelMessages,
  messageById,
  allMessages
}
