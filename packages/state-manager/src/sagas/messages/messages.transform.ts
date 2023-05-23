import { PublicChannelsMessagesBase, ChannelMessage } from '@quiet/types'
import { Dictionary, EntityState } from '@reduxjs/toolkit'
import { createTransform } from 'redux-persist'
import { StoreKeys } from '../store.keys'
import { messageSendingStatusAdapter } from './messages.adapter.ts'
import { MessagesState } from './messages.slice'

export const MessagesTransform = createTransform(
  (inboundState: MessagesState, _key: any) => {
    return { ...inboundState }
  },
  (outboundState: MessagesState, _key: any) => {
    outboundState.publicChannelsMessagesBase.entities = transformPublicChannelsMessagesBaseEntities(
      outboundState.publicChannelsMessagesBase.entities
    )

    return {
      ...outboundState,
      publicKeyMapping: {},
      publicChannelsMessagesBase: outboundState.publicChannelsMessagesBase,
      messageSendingStatus: messageSendingStatusAdapter.getInitialState()
    }
  },
  { whitelist: [StoreKeys.Messages] }
)

const transformPublicChannelsMessagesBaseEntities = (
  messagesBaseEntities: Dictionary<PublicChannelsMessagesBase>
) => {
  const messagesRefactor = (messages: EntityState<ChannelMessage>) => {
    const transformedMessagesEntities = messages.entities
    for (const [key, _message] of Object.entries(transformedMessagesEntities)) {
      const message = { ..._message } as any
      if (message.channelAddress) {
        const transformedMessage = {
          ...message,
          channelId: message.channelAddress
        }
        delete transformedMessage.channelAddress

        transformedMessagesEntities[key] = transformedMessage
      }
    }

    return transformedMessagesEntities
  }

  for (const [key, _message] of Object.entries(messagesBaseEntities)) {
    const message = { ..._message } as any
    if (message.channelAddress) {
        const messages = messagesRefactor(message.messages)
        const transformedMessage = {
            ...message,
            messages,
            channelId: message.channelAddress
        }
        delete transformedMessage.channelAddress

        messagesBaseEntities[key] = transformedMessage
    }
  }
  return messagesBaseEntities
}
