export enum IpfsFilesManagerEvents {
  // Incoming evetns
  DOWNLOAD_FILE = 'downloadFile',
  CANCEL_DOWNLOAD = 'cancelDownload',
  UPLOAD_FILE = 'uploadFile',
  DELETE_FILE = 'deleteFile',
  // Outgoing evnets
  MESSAGE_MEDIA_UPDATED = 'messageMediaUpdated',
  DOWNLOAD_PROGRESS = 'downloadProgress',
}
export interface FilesData {
  size: number
  downloadedBytes: number
  transferSpeed: number
  cid: string
  message: {
    id: string
  }
}
