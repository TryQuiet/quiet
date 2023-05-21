export interface FileContent {
    path: string | null // Should it be nullable?
    name: string
    ext: string
  }

  export interface FileMetadata extends FileContent {
    cid: string
    message: FileMessage
    size?: number
    width?: number
    height?: number
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
    mid: string
    cid: string
  }

  export interface CancelDownloadPayload {
    mid: string
    peerId: string
  }

  export interface DownloadStatus {
    mid: string // Message id
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
    None = '',
    Uploading = 'uploading',
    Hosted = 'hosted',
    Ready = 'ready',
    Queued = 'queued',
    Downloading = 'downloading',
    Completed = 'completed',
    Canceling = 'canceling',
    Canceled = 'canceled',
    Malicious = 'malicious'
  }

  export const imagesExtensions = ['.gif', '.png', '.jpg', '.jpeg']
