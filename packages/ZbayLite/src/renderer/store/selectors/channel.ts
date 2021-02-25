import { createSelector } from 'reselect'
import identitySelectors from './identity'
import messagesQueueSelectors from './messagesQueue'
import contacts from './contacts'
import { networkFee, messageType } from '../../../shared/static'
import publicChannels from './publicChannels'
import users from './users'

import { Store } from '../reducers'
import { DisplayableMessage } from '../../zbay/messages.types'

const channel = (s: Store) => s.channel

export const channelInfo = createSelector(channel, ch => {
  const channel = {
    ...ch
  }
  delete channel.message
  return channel
}) // TODO refactor

const isPublicChannel = createSelector(
  publicChannels.publicChannels,
  channel,
  (pubChannels, channel) => {
    if (pubChannels && channel) {
      const publicChannelAddresses = Object.values(pubChannels).map(el => el.address)
      const { address } = channel
      return publicChannelAddresses.includes(address)
    } else {
      return false
    }
  }
)

export const spentFilterValue = createSelector(channel, c =>
  c.spentFilterValue ? spentFilterValue : -1
)

export const message = createSelector(channel, c => c.message[c.id] || '')
export const id = createSelector(channel, c => c.id)
const data = createSelector(contacts.contacts, id, (channels, id) => channels[id])
export const isSizeCheckingInProgress = createSelector(channel, c => c.isSizeCheckingInProgress)
export const messageSizeStatus = createSelector(channel, c => c.messageSizeStatus)
export const displayableMessageLimit = createSelector(channel, c => c.displayableMessageLimit)
export const isOwner = createSelector(
  id,
  contacts.contacts,
  identitySelectors.signerPubKey,
  (id, con, myKey) => {
    const contact = con[id]
    if (!contact) {
      return false
    }
    const settingsMsg = Array.from(Object.values(contact.messages)).filter(
      msg => msg.type === messageType.CHANNEL_SETTINGS
    )[0]
    if (settingsMsg && settingsMsg.message.owner === myKey) {
      return true
    }
    return false
  }
)
export const channelSettingsMessage = createSelector(data, data => {
  if (!data) {
    return null
  }
  const settingsMsg = Array.from(Object.values(data.messages)).filter(
    msg =>
      msg.type === messageType.CHANNEL_SETTINGS || msg.type === messageType.CHANNEL_SETTINGS_UPDATE
  )
  if (!settingsMsg.length) {
    return null
  }
  return settingsMsg.reduce((prev, curr) => (prev.createdAt > curr.createdAt ? prev : curr))
})
export const advertFee = createSelector(channelSettingsMessage, settingsMsg => {
  if (settingsMsg === null) {
    return 0
  }
  return settingsMsg.message.minFee || settingsMsg.message.updateMinFee
})
export const channelDesription = createSelector(channelSettingsMessage, settingsMsg => {
  if (settingsMsg === null) {
    return 0
  }
  return settingsMsg.message.updateChannelDescription || ''
})
export const onlyRegistered = createSelector(channelSettingsMessage, settingsMsg => {
  if (settingsMsg === null) {
    return 0
  }
  return settingsMsg.message.updateOnlyRegistered || '0'
})
export const unread = createSelector(data, data => (data ? data.unread : 0))

export const queuedMessages = createSelector(
  messagesQueueSelectors.queue,
  channel,
  (queue, channel) => queue.filter(m => m.channelId === channel.id)
)

export const loader = createSelector(channel, meta => meta.loader)

const checkMessageTargetTimeWindow = ({ targetCreatedAt, timeStamp, timeWindow }) => {
  const inRange = ({ timeStamp, targetCreatedAt, timeWindow }) => {
    return (timeStamp - targetCreatedAt) * (timeStamp - timeWindow) <= 0
  }
  return inRange({ timeStamp, targetCreatedAt, timeWindow })
}

const concatMessages = (mainMsg, messagesToConcat) => {
  if (messagesToConcat.length === 1) {
    return mainMsg
  } else {
    const messagesArray = messagesToConcat.map(msg => msg.message)
    const lastMessageStatus = messagesToConcat[messagesToConcat.length - 1].status
    const concatedMessages = messagesArray.join('\n')
    const mergedMessage = {
      ...mainMsg,
      message: concatedMessages,
      status: lastMessageStatus
    }
    return mergedMessage
  }
}

export const mergeIntoOne = (messages: DisplayableMessage[]) => {
  if (messages.length === 0) return
  const result = [[]]
  let last: DisplayableMessage = null
  for (const msg of messages) {
    const isMessageInTargetZone = last
      ? checkMessageTargetTimeWindow({
        targetCreatedAt: last.createdAt,
        timeStamp: msg.createdAt,
        timeWindow: last.createdAt + 300
      })
      : true
    if (last && msg.status === 'failed') {
      result.push([])
      result[result.length - 1].push(msg)
    } else if (last && (msg.type !== 1 || last.type !== 1)) {
      result.push([])
      result[result.length - 1].push(msg)
    } else if ((last && last.sender.replyTo !== msg.sender.replyTo) || !isMessageInTargetZone) {
      result.push([])
      result[result.length - 1].push(msg)
    } else {
      result[result.length - 1].push(msg)
    }
    last = msg
  }
  const concatedMessages = result.map(array => {
    return concatMessages(array[0], array)
  })
  return concatedMessages
}

export const shareableUri = createSelector(channel, c => c.shareableUri)

export const inputLocked = createSelector(
  identitySelectors.balance('zec'),
  identitySelectors.lockedBalance('zec'),
  users.users,
  identitySelectors.signerPubKey,
  (available, locked, users, signerPubKey) => {
    if (available.gt(networkFee)) {
      if (users[signerPubKey]) {
        if (users[signerPubKey].createdAt) {
          return INPUT_STATE.AVAILABLE
        } else {
          return INPUT_STATE.UNREGISTERED
        }
      }
    } else {
      if (locked.gt(0)) {
        return INPUT_STATE.LOCKED
      }
    }
    return INPUT_STATE.DISABLE
  }
)

export const INPUT_STATE = {
  DISABLE: 0,
  AVAILABLE: 1,
  LOCKED: 2,
  UNREGISTERED: 3
}

export const channelId = createSelector(channel, ch => ch.id)

export const members = createSelector(contacts.contacts, id, (c, channelId) => {
  const contact = c[channelId]
  if (!contact) {
    return new Set()
  }
  return Array.from(Object.values(contact.messages)).reduce((acc, msg) => {
    return acc.add(msg.sender.replyTo)
  }, new Set())
})

export const channelParticipiants = createSelector(contacts.contacts, id, (c, i) => {
  const contact = c[i]
  if (!contact) {
    return new Set()
  }
  const messages = contact.messages
  const members = Array.from(Object.values(messages)).reduce((acc, msg) => {
    return acc.add(msg.sender.replyTo)
  }, new Set())
  return members
})

export default {
  data,
  inputLocked,
  loader,
  channel,
  spentFilterValue,
  message,
  shareableUri,
  channelId,
  channelInfo,
  advertFee,
  onlyRegistered,
  members,
  channelParticipiants,
  unread,
  messageSizeStatus,
  isSizeCheckingInProgress,
  id,
  isOwner,
  channelDesription,
  displayableMessageLimit,
  isPublicChannel
}
