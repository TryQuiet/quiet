import { createSlice, EntityState, PayloadAction } from '@reduxjs/toolkit'
import { StoreKeys } from '../store.keys'
import { downloadStatusAdapter } from './files.adapter'
import { DownloadState, DownloadStatus } from './files.types'

export class FilesState {
  public downloadStatus: EntityState<DownloadStatus> = downloadStatusAdapter.getInitialState()
}

export const filesSlice = createSlice({
  initialState: { ...new FilesState() },
  name: StoreKeys.Files,
  reducers: {
    updateDownloadStatus: (state, action: PayloadAction<DownloadStatus>) => {
      let { cid, downloadState, downloadProgress } = action.payload
      if (
        downloadProgress.size !== downloadProgress.downloaded &&
        downloadProgress.transferSpeed === 0
      ) {
        downloadState = DownloadState.Queued
      }
      downloadStatusAdapter.upsertOne(state.downloadStatus, {
        cid: cid,
        downloadState: downloadState,
        downloadProgress: downloadProgress
      })
    }
  }
})

export const filesActions = filesSlice.actions
export const filesReducer = filesSlice.reducer
