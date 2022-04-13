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

export const messagesSendingStatus = createSelector(messagesSlice, reducerState =>
  messageSendingStatusAdapter
    .getSelectors()
    .selectAll(reducerState.messageSendingStatus)
)

export const pendingMessages = createSelector(messagesSendingStatus, status => 
  status.filter(message => message.status === SendingStatus.Pending)
)

export const pendingMessagesMapping = createSelector(pendingMessages, messages => {
  const mapping: { [id: string]: MessageSendingStatus } = messages.reduce((mapping, message) => {
    mapping[message.id] = message
    return mapping
  }, {})
  return mapping
})

export const messagesSelectors = {
  publicKeysMapping,
  messagesVerificationStatus,
  messagesSendingStatus,
  pendingMessagesMapping
}
