import { createEntityAdapter } from '@reduxjs/toolkit'
import { MessageVerificationStatus } from '../messages.types'

export const messageVerificationStatusAdapter = createEntityAdapter<MessageVerificationStatus>({
  selectId: status => status.signature
})
