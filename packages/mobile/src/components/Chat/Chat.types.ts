import {
  DisplayableMessage,
  DownloadStatus,
  FileMetadata,
  FilePreviewData,
  MessagesDailyGroups,
  MessageSendingStatus,
  PublicChannel,
} from '@quiet/types'
import { Dictionary } from '@reduxjs/toolkit'
import { useContextMenu } from '../../hooks/useContextMenu'
import { DocumentPickerResponse } from 'react-native-document-picker'
import { UserLabelHandlers } from '../UserLabel/UserLabel.types'

// Define a new type for date groups with timestamps
export interface DateGroup {
  displayDate: string // Displayed date string like "Today", "Yesterday", etc.
  timestamp: number // ISO timestamp for accurate sorting
}

// Define a new type for flattened list items (either a divider or a message group)
export type ListItem =
  | { type: 'divider'; id: string; displayDate: string }
  | {
      type: 'message'
      id: string
      displayDate: string
      messageGroup: DisplayableMessage[]
    }

export interface ChatProps extends UserLabelHandlers {
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
  updateUploadedFiles: (filesData: DocumentPickerResponse[]) => void
  removeFilePreview: (id: string) => void
  uploadedFiles?: FilePreviewData
  openUrl: (url: string) => void
  ready?: boolean
}

export interface ChannelMessagesComponentProps extends UserLabelHandlers {
  day: string
  messages: DisplayableMessage[][]
  pendingMessages?: Dictionary<MessageSendingStatus>
  downloadStatuses?: Dictionary<DownloadStatus>
  openImagePreview: (media: FileMetadata) => void
  openUrl: (url: string) => void
}
