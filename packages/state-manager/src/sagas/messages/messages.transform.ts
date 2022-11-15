import { createTransform } from 'redux-persist'
import { channelMessagesAdapter } from '../publicChannels/publicChannels.adapter'
import { ChannelMessage } from '../publicChannels/publicChannels.types'
import { StoreKeys } from '../store.keys'
import { messagesBaseAdapter, messageSendingStatusAdapter, messageVerificationStatusAdapter, publicChannelsMessagesBaseAdapter } from './messages.adapter.ts'
import { MessagesState } from './messages.slice'
import { MessageVerificationStatus, PublicChannelsMessagesBase } from './messages.types'

export const MessagesTransform = createTransform(
  (inboundState: MessagesState, _key) => {
    return { ...inboundState }
  },
  (outboundState: MessagesState, _key) => {
    const messageVerificationStatus = Object.values(outboundState.messageVerificationStatus.entities)
    const updatedMessageVerificationStatus: MessageVerificationStatus[] = messageVerificationStatus.reduce((result, status: any) => {
      if (status.isVerified !== undefined ||
      status.verified !== undefined
      ) {
        const entry: MessageVerificationStatus = {
          ...status,
          isVerified: status.isVerified ? status.isVerified : status.verified
        }

        result.push(entry)
      }
      return result
    }, [])

    const messagesBase: PublicChannelsMessagesBase[] = []
    let messagesInChannel: ChannelMessage[]

    updatedMessageVerificationStatus.forEach((status) => {
      Object.values(outboundState.publicChannelsMessagesBase.entities).forEach((channelMessages) => {
        messagesInChannel = []
        Object.values(channelMessages.messages.entities).forEach((message) => {
          if (status.signature === message.signature) {
            messagesInChannel.push(message)
          }
        })

        messagesBase.push({
          ...channelMessages,
          messages: channelMessagesAdapter.setAll(
            messagesBaseAdapter.getInitialState(),
            messagesInChannel
          )
        })
      })
    })

      return {
      ...outboundState,
      messageVerificationStatus: messageVerificationStatusAdapter.setAll(
        messageVerificationStatusAdapter.getInitialState(),
        updatedMessageVerificationStatus
      ),
      publicChannelsMessagesBase: publicChannelsMessagesBaseAdapter.setAll(
        publicChannelsMessagesBaseAdapter.getInitialState(),
        messagesBase
      ),
      publicKeyMapping: {},
      messageSendingStatus: messageSendingStatusAdapter.getInitialState(),
      }
    },
  { whitelist: [StoreKeys.Messages] }
)
