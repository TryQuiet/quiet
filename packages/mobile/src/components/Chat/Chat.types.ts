import {
  DisplayableMessage,
  MessagesDailyGroups,
  PublicChannel
} from '@quiet/state-manager'

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
  messages: DisplayableMessage[][]
  day: string
}
