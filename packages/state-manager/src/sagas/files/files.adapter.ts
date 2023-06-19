import { type DownloadStatus } from '@quiet/types'
import { createEntityAdapter } from '@reduxjs/toolkit'

export const downloadStatusAdapter = createEntityAdapter<DownloadStatus>({
  selectId: file => file.mid,
})
