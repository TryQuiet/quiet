import { createSelector } from 'reselect'
import { notificationFilterType, soundType } from '../../../shared/static'

import { Store } from '../reducers'

const notificationCenter = (s: Store) => s.notificationCenter

const channels = createSelector(notificationCenter, a => a.channels)
const user = createSelector(notificationCenter, a => a.user)
const contacts = createSelector(notificationCenter, a => a.contacts)
const userFilterType = createSelector(
  user,
  a => a.filterType || notificationFilterType.ALL_MESSAGES
)
const userSound = createSelector(user, a => a.sound || soundType.NONE)
const channelFilterById = channelId =>
  createSelector(channels, channels => channels[channelId] || notificationFilterType.ALL_MESSAGES)
const blockedUsers = createSelector(contacts, contacts =>
  Array.from(Object.values(contacts)).filter(type => type === notificationFilterType.MUTE)
)
const contactFilterByAddress = address =>
  createSelector(contacts, contacts => contacts[address] || notificationFilterType.ALL_MESSAGES)
export default {
  channels,
  user,
  contacts,
  channelFilterById,
  userFilterType,
  notificationCenter,
  contactFilterByAddress,
  userSound,
  blockedUsers
}
