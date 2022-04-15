import { createSelector } from 'reselect'
import { StoreKeys } from '../store.keys'
import { CreatedSelectors, StoreState } from '../store.types'
import { messageSendingStatusAdapter, messageVerificationStatusAdapter } from './messages.adapter.ts'
import { MessageSendingStatus, SendingStatus } from './messages.types'

const messagesSlice: CreatedSelectors[StoreKeys.Messages] = (state: StoreState) =>
  state[StoreKeys.Messages]

export const publicKeysMapping = createSelector(
  messagesSlice,
  reducerState => reducerState.publicKeyMapping
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
  messagesVerificationStatus,
  messagesSendingStatus
}
