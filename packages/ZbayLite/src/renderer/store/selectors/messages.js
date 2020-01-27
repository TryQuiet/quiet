import { createSelector } from 'reselect'
import Immutable from 'immutable'
import { messageType } from '../../../shared/static'

const store = s => s

const messages = createSelector(
  store,
  state => state.get('messages')
)
const currentChannelMessages = channelId =>
  createSelector(
    messages,
    msgs => {
      return msgs.getIn([channelId, 'messages'], Immutable.List())
    }
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

const channelModerators = channelId => createSelector(
  getFilteredContexed(channelId),
  channelState => channelState.get('channelModerators')
)

const channelBlockedUsers = channelId => createSelector(
  getFilteredContexed(channelId),
  channelState => channelState.get('blockedUsers')
)

const getChannelFilteredMessages = channelId => createSelector(
  getFilteredContexed(channelId),
  channelState => channelState.get('visibleMessages')
)

const getFilteredContexed = channelId => createSelector(
  channelOwner(channelId),
  currentChannelMessages(channelId),
  (channelOwner, msgs) => {
    let channelModerators = Immutable.List()
    let messsagesToRemove = Immutable.List()
    let blockedUsers = Immutable.List()
    let visibleMessages = Immutable.List()
    for (const msg of msgs) {
      switch (msg.get('type')) {
        case messageType.AD:
          if (!blockedUsers.includes(msg.get('publicKey'))) {
            visibleMessages = visibleMessages.push(msg)
          }
          break
        case messageType.BASIC:
          if (!blockedUsers.includes(msg.get('publicKey'))) {
            visibleMessages = visibleMessages.push(msg)
          }
          break
        case messageType.MODERATION:
          const senderPk = msg.get('publicKey')
          const moderationType = msg.getIn(['message', 'moderationType'])
          const moderationTarget = msg.getIn(['message', 'moderationTarget'])
          if (channelOwner === senderPk && moderationType === 'ADD_MOD') {
            channelModerators = channelModerators.push(moderationTarget)
          } else if (channelOwner === senderPk && moderationType === 'REMOVE_MOD') {
            const indexToRemove = channelModerators.findIndex(el => el === moderationTarget)
            if (indexToRemove !== -1) {
              channelModerators = channelModerators.remove(indexToRemove)
            }
          } else if ((channelOwner === senderPk || channelModerators.includes(senderPk)) && moderationType === 'BLOCK_USER') {
            blockedUsers = blockedUsers.push(moderationTarget)
          } else if ((channelOwner === senderPk || channelModerators.includes(senderPk)) && moderationType === 'UNBLOCK_USER') {
            const indexToRemove = blockedUsers.findIndex(el => el === moderationTarget)
            if (indexToRemove !== -1) {
              blockedUsers = blockedUsers.remove(indexToRemove)
            }
          } else if ((channelOwner === senderPk || channelModerators.includes(senderPk)) && moderationType === 'REMOVE_MESSAGE') {
            const indexToRemove = visibleMessages.findIndex(el => el.get('id') === moderationTarget)
            if (indexToRemove !== -1) {
              visibleMessages = visibleMessages.remove(indexToRemove)
            }
          } else {}
          break
      }
    }
    return Immutable.fromJS({
      channelModerators,
      messsagesToRemove,
      blockedUsers,
      visibleMessages
    })
  }
)

export default {
  messages,
  channelOwner,
  channelModerators,
  channelBlockedUsers,
  channelSettingsMessages,
  getChannelFilteredMessages,
  currentChannelMessages,
  messageById,
  getFilteredContexed,
  allMessages
}
