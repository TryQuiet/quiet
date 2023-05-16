import { createTransform } from 'redux-persist'
import { StoreKeys } from '../store.keys'
import { messageSendingStatusAdapter } from './messages.adapter.ts'
import { MessagesState } from './messages.slice'

export const MessagesTransform = createTransform(
  (inboundState: MessagesState, _key) => {
    return { ...inboundState }
  },
  (outboundState: MessagesState, _key) => {
    return {
      ...outboundState,
      publicKeyMapping: {},
      messageSendingStatus: messageSendingStatusAdapter.getInitialState(),
    }
  },
  { whitelist: [StoreKeys.Messages] }
)
