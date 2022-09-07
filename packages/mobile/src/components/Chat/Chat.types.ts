import {
  DisplayableMessage,
  MessagesDailyGroups,
  MessageSendingStatus,
  PublicChannel
} from '@quiet/state-manager'
import { Dictionary } from '@reduxjs/toolkit/dist/entities/models'

export interface ChatProps {
  sendMessageAction: (message: string) => void
  loadMessagesAction: (load: boolean) => void
  channel: PublicChannel
  user: string
  messages?: {
    count: number
    groups: MessagesDailyGroups
  }
  pendingMessages?: Dictionary<MessageSendingStatus>
}

export interface ChannelMessagesComponentProps {
  messages: DisplayableMessage[][]
  day: string
  pendingMessages?: Dictionary<MessageSendingStatus>
}
