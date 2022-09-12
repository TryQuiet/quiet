import { DisplayableMessage, MessageSendingStatus } from '@quiet/state-manager'
import { Dictionary } from '@reduxjs/toolkit'

export interface MessageProps {
  data: DisplayableMessage[],
  pendingMessages?: Dictionary<MessageSendingStatus>
}
