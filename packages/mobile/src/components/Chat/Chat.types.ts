import {
  DisplayableMessage,
  DownloadStatus,
  FileMetadata,
  MessagesDailyGroups,
  MessageSendingStatus,
  PublicChannel
} from '@quiet/state-manager'
import { Dictionary } from '@reduxjs/toolkit'
import { useContextMenu } from '../../hooks/useContextMenu'

export interface ChatProps {
  contextMenu?: ReturnType<typeof useContextMenu> | null
  sendMessageAction: (message: string) => void
  loadMessagesAction: (load: boolean) => void
  handleBackButton: () => void
  channel: PublicChannel
  messages?: {
    count: number
    groups: MessagesDailyGroups
  }
  pendingMessages?: Dictionary<MessageSendingStatus>
  downloadStatuses?: Dictionary<DownloadStatus>
  imagePreview?: FileMetadata | null
  setImagePreview?: (media: FileMetadata | null) => void
  openImagePreview: (media: FileMetadata) => void
  openUrl: (url: string) => void
}

export interface ChannelMessagesComponentProps {
  day: string
  messages: DisplayableMessage[][]
  pendingMessages?: Dictionary<MessageSendingStatus>
  downloadStatuses?: Dictionary<DownloadStatus>
  openImagePreview: (media: FileMetadata) => void
  openUrl: (url: string) => void
}
