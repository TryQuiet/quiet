import { DownloadStatus, FileMetadata } from "@quiet/state-manager";

export interface UploadedFileProps {
  media: FileMetadata
  downloadStatus: DownloadStatus
}