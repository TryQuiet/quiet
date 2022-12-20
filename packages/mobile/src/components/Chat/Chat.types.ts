import {
  DisplayableMessage,
  DownloadStatus,
  FileMetadata,
  MessagesDailyGroups,
  MessageSendingStatus,
  PublicChannel
} from '@quiet/state-manager'
import { Dictionary } from '@reduxjs/toolkit'

export interface ChatProps {
  sendMessageAction: (message: string) => void
  loadMessagesAction: (load: boolean) => void
  handleBackButton: () => void
  channel: PublicChannel
  user: string
  messages?: {
    count: number
    groups: MessagesDailyGroups
  }
  pendingMessages?: Dictionary<MessageSendingStatus>
  downloadStatuses?: Dictionary<DownloadStatus>
  imagePreview?: FileMetadata
  setImagePreview?: (media: FileMetadata) => void
  openImagePreview?: (media: FileMetadata) => void
  openUrl?: (url: string) => void
}

export interface ChannelMessagesComponentProps {
  day: string
  messages: DisplayableMessage[][]
  pendingMessages?: Dictionary<MessageSendingStatus>
  downloadStatuses?: Dictionary<DownloadStatus>
  openImagePreview?: (media: FileMetadata) => void
  openUrl?: (url: string) => void
}
