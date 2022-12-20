import { DisplayableMessage, DownloadStatus, FileMetadata, MessageSendingStatus } from '@quiet/state-manager'
import { Dictionary } from '@reduxjs/toolkit'

export interface MessageProps {
  data: DisplayableMessage[]
  pendingMessages?: Dictionary<MessageSendingStatus>
  downloadStatus?: DownloadStatus
  openImagePreview?: (medi: FileMetadata) => void
  openUrl?: (url: string) => void
}
