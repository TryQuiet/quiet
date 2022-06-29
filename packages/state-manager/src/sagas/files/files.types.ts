export interface FileContent {
  path: string
  name: string
  ext: string
}

export interface FileMetadata extends FileContent {
  cid: string
  width?: number
  height?: number
  message?: FileMessage // Empty message means file uploading didn't finish yet
}

export interface FileMessage {
  id: string
  channelAddress: string
}

export interface UploadFilePayload {
  file: FileContent
  peerId: string
}

export interface DownloadFilePayload {
  metadata: FileMetadata
  peerId: string
}

export interface DownloadProgressPayload {
  downloaded: number
  message: FileMessage
}
