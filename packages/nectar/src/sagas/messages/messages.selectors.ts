import { createSelector } from 'reselect'
import { channelMessagesAdapter } from '../publicChannels/publicChannels.adapter'
import { currentChannelAddress } from '../publicChannels/publicChannels.selectors'
import { StoreKeys } from '../store.keys'
import { CreatedSelectors, StoreState } from '../store.types'
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
    return channelMessagesAdapter
    .getSelectors()
    .selectAll(base.messages)
  }
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

export const messagesSelectors = {
  publicKeysMapping,
  publicChannelsMessagesBase,
  currentPublicChannelMessagesBase,
  currentPublicChannelMessagesEntries,
  messagesVerificationStatus,
  messagesSendingStatus
}
