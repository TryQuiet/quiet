import { createEntityAdapter } from '@reduxjs/toolkit'
import { MessageSendingStatus, MessageVerificationStatus, PublicChannelsMessagesBase } from './messages.types'

export const publicChannelsMessagesBaseAdapter = createEntityAdapter<PublicChannelsMessagesBase>({
  selectId: base => base.channelAddress
})

export const messageVerificationStatusAdapter = createEntityAdapter<MessageVerificationStatus>({
  selectId: status => status.signature
})

export const messageSendingStatusAdapter = createEntityAdapter<MessageSendingStatus>()
