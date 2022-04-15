import { createTransform } from 'redux-persist'
import { StoreKeys } from '../store.keys'
import { messageSendingStatusAdapter } from './messages.adapter.ts'
import { MessagesState } from './messages.slice'

export const MessagesTransform = createTransform(
  (inboundState: MessagesState, _key) => {
    return { ...inboundState, publicKeyMapping: {} }
  },
  (outboundState: MessagesState, _key) => {
    return {
      ...outboundState,
      messageSendingStatus: messageSendingStatusAdapter.getInitialState(),
      publicKeyMapping: {}
    }
  },
  { whitelist: [StoreKeys.Messages] }
)
