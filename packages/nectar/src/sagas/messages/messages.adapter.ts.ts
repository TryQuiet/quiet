import { createEntityAdapter } from '@reduxjs/toolkit'
import { MessageSendingStatus, MessageVerificationStatus } from './messages.types'

export const messageVerificationStatusAdapter = createEntityAdapter<MessageVerificationStatus>({
  selectId: status => status.signature
})

export const messageSendingStatusAdapter = createEntityAdapter<MessageSendingStatus>()
