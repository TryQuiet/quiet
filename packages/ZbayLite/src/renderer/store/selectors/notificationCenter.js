import { createSelector } from 'reselect'
import { notificationFilterType, soundType } from '../../../shared/static'
const store = s => s

export const notificationCenter = createSelector(store, state =>
  state.get('notificationCenter')
)

const channels = createSelector(notificationCenter, a => a.channels)
const user = createSelector(notificationCenter, a => a.user)
const contacts = createSelector(notificationCenter, a => a.contacts)
const userFilterType = createSelector(
  user,
  a => a.get('filterType') || notificationFilterType.ALL_MESSAGES
)
const userSound = createSelector(user, a => a.get('sound') || soundType.NONE)
const channelFilterById = channelId =>
  createSelector(
    channels,
    channels => channels.get(channelId) || notificationFilterType.ALL_MESSAGES
  )
const blockedUsers = createSelector(contacts, contacts =>
  contacts.filter(type => type === notificationFilterType.MUTE)
)
const contactFilterByAddress = address =>
  createSelector(
    contacts,
    contacts => contacts.get(address) || notificationFilterType.ALL_MESSAGES
  )
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
