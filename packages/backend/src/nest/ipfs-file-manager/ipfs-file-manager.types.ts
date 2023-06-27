export enum IpfsFilesManagerEvents {
  // Incoming evetns
  DOWNLOAD_FILE = 'downloadFile',
  CANCEL_DOWNLOAD = 'cancelDownload',
  UPLOAD_FILE = 'uploadFile',
  DELETE_FILE = 'deleteFile',
  // Outgoing evnets
  UPDATE_MESSAGE_MEDIA = 'updateMessageMedia',
  UPDATE_DOWNLOAD_PROGRESS = 'updateDownloadProgress',
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
