export interface FileContent {
    buffer: string
    name: string
    ext: string
    dir: string
}

export interface FileMetadata {
    cid: string
}

export interface UploadFilePayload {
    file: FileContent
    peerId: string
}
