import { createSelector } from 'reselect'
import { channelMessagesAdapter } from '../publicChannels/publicChannels.adapter'
import { currentChannelAddress } from '../publicChannels/publicChannels.selectors'
import { StoreKeys } from '../store.keys'
import { CreatedSelectors, StoreState } from '../store.types'
import { certificatesMapping } from '../users/users.selectors'
import {
  messageSendingStatusAdapter,
  messageVerificationStatusAdapter,
  publicChannelsMessagesBaseAdapter
} from './messages.adapter.ts'

const messagesSlice: CreatedSelectors[StoreKeys.Messages] = (state: StoreState) =>
  state[StoreKeys.Messages]

export const publicKeysMapping = createSelector(
  messagesSlice,
  reducerState => reducerState.publicKeyMapping
)

export const messagesVerificationStatus = createSelector(messagesSlice, reducerState =>
  messageVerificationStatusAdapter
    .getSelectors()
    .selectEntities(reducerState.messageVerificationStatus)
)

export const messagesSendingStatus = createSelector(messagesSlice, reducerState => {
  return messageSendingStatusAdapter
    .getSelectors()
    .selectEntities(reducerState.messageSendingStatus)
})

export const publicChannelsMessagesBase = createSelector(messagesSlice, reducerState =>
  publicChannelsMessagesBaseAdapter
    .getSelectors()
    .selectEntities(reducerState.publicChannelsMessagesBase)
)

export const currentPublicChannelMessagesBase = createSelector(
  publicChannelsMessagesBase,
  currentChannelAddress,
  (base, address) => {
    return base[address]
  }
)

export const currentPublicChannelMessagesEntries = createSelector(
  currentPublicChannelMessagesBase,
  (base) => {
    if (!base) return []
    return channelMessagesAdapter
    .getSelectors()
    .selectAll(base.messages)
    .sort((a, b) => b.createdAt - a.createdAt).reverse()
  }
)

export const validCurrentPublicChannelMessagesEntries = createSelector(
  currentPublicChannelMessagesEntries,
  certificatesMapping,
  messagesVerificationStatus,
  (messages, certificates, verification) => {
    const filtered = messages.filter(message => message.pubKey in certificates)
    return filtered.filter(message => {
      const status = verification[message.signature]
      if (
        status &&
        status.publicKey === message.pubKey &&
        status.signature === message.signature &&
        status.verified
      ) {
        return message
      }
    })
  }
)

export const sortedCurrentPublicChannelMessagesEntries = createSelector(
  validCurrentPublicChannelMessagesEntries,
  messages => {
    return messages.sort((a, b) => b.createdAt - a.createdAt).reverse()
  }
)

export const missingChannelsMessages = (ids, channelAddress) => createSelector(
  publicChannelsMessagesBase,
  (base) => {
    const channelIds = channelMessagesAdapter
    .getSelectors()
    .selectIds(base[channelAddress].messages)
    return ids.filter((id) => !channelIds.includes(id))
  }
)

export const messagesSelectors = {
  publicKeysMapping,
  publicChannelsMessagesBase,
  currentPublicChannelMessagesBase,
  sortedCurrentPublicChannelMessagesEntries,
  messagesVerificationStatus,
  messagesSendingStatus
}
