import {
    type ChannelMessage,
    type MessageSendingStatus,
    type MessageVerificationStatus,
    type PublicChannelsMessagesBase,
} from '@quiet/types'
import { createEntityAdapter } from '@reduxjs/toolkit'

export const publicChannelsMessagesBaseAdapter = createEntityAdapter<PublicChannelsMessagesBase>({
    selectId: base => base.channelId,
})

export const messagesBaseAdapter = createEntityAdapter<ChannelMessage>()

export const messageVerificationStatusAdapter = createEntityAdapter<MessageVerificationStatus>({
    selectId: status => status.signature,
})

export const messageSendingStatusAdapter = createEntityAdapter<MessageSendingStatus>()
