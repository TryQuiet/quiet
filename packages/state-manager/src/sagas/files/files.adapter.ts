import { createEntityAdapter } from '@reduxjs/toolkit'
import { DownloadStatus } from './files.types'

export const downloadStatusAdapter = createEntityAdapter<DownloadStatus>({
  selectId: file => file.cid
})
