import { createTransform } from 'redux-persist'
import { StoreKeys } from '../store.keys'
import { messageSendingStatusAdapter } from './messages.adapter.ts'
import { type MessagesState } from './messages.slice'
import { filterEntityStateByIds, filterTransportVerifiedMessages } from './verifiedMessagePersistence'
import { type EntityId } from '@reduxjs/toolkit'

export const sanitizeMessagesPersistenceState = (outboundState: MessagesState): MessagesState => {
  const retainedMessageIds = new Set<EntityId>()
  const entities = { ...outboundState.publicChannelsMessagesBase.entities }
  for (const channelId of outboundState.publicChannelsMessagesBase.ids) {
    const messagesBase = entities[channelId]
    if (messagesBase == null) continue
    const messages = filterTransportVerifiedMessages(messagesBase.messages)
    for (const messageId of messages.ids) retainedMessageIds.add(messageId)
    entities[channelId] = { ...messagesBase, messages }
  }

  return {
    ...outboundState,
    publicChannelsMessagesBase: {
      ...outboundState.publicChannelsMessagesBase,
      entities,
    },
    messageVerificationStatus: filterEntityStateByIds(outboundState.messageVerificationStatus, retainedMessageIds),
    publicKeyMapping: {},
    messageSendingStatus: messageSendingStatusAdapter.getInitialState(),
  }
}

export const MessagesTransform = createTransform(
  (inboundState: MessagesState, _key: any) => {
    return { ...inboundState }
  },
  (outboundState: MessagesState, _key: any) => sanitizeMessagesPersistenceState(outboundState),
  { whitelist: [StoreKeys.Messages] }
)
