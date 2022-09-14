import {
  DisplayableMessage,
  DownloadStatus,
  FileMetadata,
  MessagesDailyGroups,
  PublicChannel
} from '@quiet/state-manager'
import { Dictionary } from '@reduxjs/toolkit'

export interface ChatProps {
  sendMessageAction: (message: string) => void
  loadMessagesAction: (load: boolean) => void
  channel: PublicChannel
  user: string
  messages?: {
    count: number
    groups: MessagesDailyGroups
  }
  downloadStatuses?: Dictionary<DownloadStatus>
  openImagePreview?: (media: FileMetadata) => void
}

export interface ChannelMessagesComponentProps {
  messages: DisplayableMessage[][]
  day: string
  downloadStatuses?: Dictionary<DownloadStatus>
  openImagePreview?: (media: FileMetadata) => void
}
