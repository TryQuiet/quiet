export interface FileContent {
    path: string
    name: string
    ext: string
    dir?: string
}

export interface FileMetadata extends FileContent {
  cid: string
}

export interface UploadFilePayload {
  file: FileContent
  peerId: string
}

export interface DownloadFilePayload {
  cid: string
  peerId: string
}
