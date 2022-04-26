import { createTransform } from 'redux-persist'
import { StoreKeys } from '../store.keys'
import { messageSendingStatusAdapter, publicChannelsMessagesBaseAdapter } from './messages.adapter.ts'
import { MessagesState } from './messages.slice'

export const MessagesTransform = createTransform(
  (inboundState: MessagesState, _key) => {
    for (const base of Object.values(inboundState.publicChannelsMessagesBase.entities)) {
      publicChannelsMessagesBaseAdapter.updateOne(inboundState.publicChannelsMessagesBase, {
        id: base.channelAddress,
        changes: {
          display: 50
        }
      })
    }
    return { ...inboundState }
  },
  (outboundState: MessagesState, _key) => {
    return {
      ...outboundState,
      publicKeyMapping: {},
      messageSendingStatus: 
        messageSendingStatusAdapter.getInitialState()
    }
  },
  { whitelist: [StoreKeys.Messages] }
)
