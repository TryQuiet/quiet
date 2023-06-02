import { DisplayableMessage, DownloadStatus, FileMetadata, MessageSendingStatus } from '@quiet/types'
import { Dictionary } from '@reduxjs/toolkit'

export interface MessageProps {
  data: DisplayableMessage[]
  pendingMessages?: Dictionary<MessageSendingStatus>
  downloadStatus?: DownloadStatus
  openImagePreview: (media: FileMetadata) => void
  openUrl: (url: string) => void
}
