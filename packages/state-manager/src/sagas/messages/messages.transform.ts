import { EntityState } from '@reduxjs/toolkit'
import { createTransform } from 'redux-persist'
import { StoreKeys } from '../store.keys'
import { messageSendingStatusAdapter, messageVerificationStatusAdapter } from './messages.adapter.ts'
import { MessagesState } from './messages.slice'
import { MessageVerificationStatus } from './messages.types'

export const MessagesTransform = createTransform(
  (inboundState: MessagesState, _key) => {
    return { ...inboundState }
  },
  (outboundState: MessagesState, _key) => {
    const messageVerificationStatus = Object.values(outboundState.messageVerificationStatus.entities)

    const updatedMessageVerificationStatus: MessageVerificationStatus[] = messageVerificationStatus.reduce((result, status: any) => {
      const entry: MessageVerificationStatus = {
        ...status,
        isVerified: status.isVerified ? status.isVerified : status.verified
      }
      if (entry['verified']) delete entry['verified']

      result.push(entry)
      return result
    }, [])

    return {
      ...outboundState,
      messageVerificationStatus: messageVerificationStatusAdapter.setAll(
        messageVerificationStatusAdapter.getInitialState(),
        updatedMessageVerificationStatus
      ),
      publicKeyMapping: {},
      messageSendingStatus:
        messageSendingStatusAdapter.getInitialState()
    }
  },
  { whitelist: [StoreKeys.Messages] }
)
