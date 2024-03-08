import { createTransform } from 'redux-persist'
import { StoreKeys } from '../store.keys'
import { messageSendingStatusAdapter } from './messages.adapter.ts'
import { type MessagesState } from './messages.slice'

export const MessagesTransform = createTransform(
  (inboundState: MessagesState, _key: any) => {
    return { ...inboundState }
  },
  (outboundState: MessagesState, _key: any) => {
    return {
      ...outboundState,
      publicKeyMapping: {},
      messageSendingStatus: messageSendingStatusAdapter.getInitialState(),
    }
  },
  { whitelist: [StoreKeys.Messages] }
)
