import {
  MessagesDailyGroups,
  PublicChannel
} from '@quiet/nectar'

export interface ChatProps {
  sendMessageAction: (message: string) => void
  channel: PublicChannel
  user: string
  messages?: {
    count: number
    groups: MessagesDailyGroups
  }
}

export interface ChannelMessagesComponentProps {
  messages: MessagesDailyGroups
}
