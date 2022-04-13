import { createSelector } from 'reselect'
import { StoreKeys } from '../store.keys'
import { CreatedSelectors, StoreState } from '../store.types'
import { messageSendingStatusAdapter } from './messages.adapter.ts'
import { messageVerificationStatusAdapter } from './verifyMessage/verifyMessageAdapter'

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
    .selectEntities(reducerState.messageSendingStatus)  
)

export const messagesSelectors = {
  publicKeysMapping,
  messageVerificationStatusAdapter
}
