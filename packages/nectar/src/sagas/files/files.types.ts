export interface FileContent {
    buffer: string
    name: string
    ext: string
    dir?: string
}

export interface FileMetadata {
  cid: string
  buffer?: string
}

export interface UploadFilePayload {
  file: FileContent
  peerId: string
}

export interface DownloadFilePayload {
  cid: string
  peerId: string
}
