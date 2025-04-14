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
  imageAttachmentPreview?: FileMetadata | null
  setImageAttachmentPreview?: (media: FileMetadata | null) => void
  openImageAttachmentPreview: (media: FileMetadata) => void
  updateFileAttachments: (filesData: DocumentPickerResponse[]) => void
  removeFilePreview: (id: string) => void
  fileAttachments?: FilePreviewData
  openUrl: (url: string) => void
  ready?: boolean
}

export interface ChannelMessagesComponentProps extends UserLabelHandlers {
  day: string
  messages: DisplayableMessage[][]
  pendingMessages?: Dictionary<MessageSendingStatus>
  downloadStatuses?: Dictionary<DownloadStatus>
  openImageAttachmentPreview: (media: FileMetadata) => void
  openUrl: (url: string) => void
}
