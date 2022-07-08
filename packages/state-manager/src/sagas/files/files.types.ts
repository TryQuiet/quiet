export interface FileContent {
  path: string
  name: string
  ext: string
}

export interface FileMetadata extends FileContent {
  cid: string
  size?: number
  width?: number
  height?: number
  message?: FileMessage // Empty message means file uploading didn't finish yet
}

export interface FileMessage {
  id: string
  channelAddress: string
}

export interface UploadFilePayload {
  file: FileMetadata
  peerId: string
}

export interface DownloadFilePayload {
  metadata: FileMetadata
  peerId: string
}

export interface CancelDownload {
  cid: string
}

export interface CancelDownloadPayload {
  cid: string
  peerId: string
}

export interface DownloadStatus {
  cid: string
  downloadState: DownloadState
  downloadProgress?: DownloadProgress
}

export interface RemoveDownloadStatus {
  cid: string
}

export interface DownloadProgress {
  size?: number
  downloaded: number
  transferSpeed: number
}

export enum DownloadState {
  Uploading = 'uploading',
  Hosted = 'hosted',
  Ready = 'ready',
  Queued = 'queued',
  Downloading = 'downloading',
  Completed = 'completed',
  Canceled = 'canceled'
}

export const imagesExtensions = ['.gif', '.png', '.jpg', '.jpeg']
