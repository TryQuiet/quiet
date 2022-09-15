import { DisplayableMessage, DownloadStatus, FileMetadata } from '@quiet/state-manager'

export interface MessageProps {
  data: DisplayableMessage[]
  downloadStatus?: DownloadStatus
  openImagePreview?: (medi: FileMetadata) => void
}
