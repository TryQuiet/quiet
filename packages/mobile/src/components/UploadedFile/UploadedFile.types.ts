import { CancelDownload, DisplayableMessage, DownloadStatus, FileMetadata } from '@quiet/types'

export interface UploadedFileProps {
  media?: FileMetadata
  message: DisplayableMessage
  downloadStatus?: DownloadStatus
}

export interface FileActionsProps {
  openContainingFolder?: (path: string) => void
  downloadFile: (media: FileMetadata) => void
  cancelDownload: (cancelDownload: CancelDownload) => void
}
