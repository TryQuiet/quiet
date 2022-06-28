export const DEFAULT_FILE_WIDTH = 300
export const DEFAULT_FILE_HEIGHT = 90

export const imagesExtensions = ['.gif', '.png', '.jpg', '.jpeg']

export enum FileDownloadState {
  Ready = 'ready',
  Queued = 'ququed',
  Downloading = 'downloading',
  Canceled = 'canceled',
  Downloaded = 'downloaded'
}
