import { createEntityAdapter } from '@reduxjs/toolkit'
import { ChannelMessage } from '../publicChannels/publicChannels.types'
import { MessageSendingStatus, MessageVerificationStatus, PublicChannelsMessagesBase } from './messages.types'

export const publicChannelsMessagesBaseAdapter = createEntityAdapter<PublicChannelsMessagesBase>({
  selectId: base => base.channelId
})

export const messagesBaseAdapter = createEntityAdapter<ChannelMessage>()

export const messageVerificationStatusAdapter = createEntityAdapter<MessageVerificationStatus>({
  selectId: status => status.signature
})

export const messageSendingStatusAdapter = createEntityAdapter<MessageSendingStatus>()
