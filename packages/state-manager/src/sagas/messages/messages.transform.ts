import { createTransform } from 'redux-persist'
import { channelMessagesAdapter } from '../publicChannels/publicChannels.adapter'
import { ChannelMessage } from '../publicChannels/publicChannels.types'
import { StoreKeys } from '../store.keys'
import { messagesBaseAdapter, messageSendingStatusAdapter, messageVerificationStatusAdapter, publicChannelsMessagesBaseAdapter } from './messages.adapter.ts'
import { MessagesState } from './messages.slice'
import { MessageVerificationStatus, PublicChannelsMessagesBase } from './messages.types'

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
