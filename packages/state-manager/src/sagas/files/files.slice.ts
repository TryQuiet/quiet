import { createSlice, type EntityState, type PayloadAction } from '@reduxjs/toolkit'
import { StoreKeys } from '../store.keys'
import { downloadStatusAdapter } from './files.adapter'
import {
    type CancelDownload,
    type CommunityId,
    type DeleteFilesFromChannelPayload,
    type DownloadStatus,
    type FileContent,
    type FileMetadata,
    type RemoveDownloadStatus,
} from '@quiet/types'

export class FilesState {
    public downloadStatus: EntityState<DownloadStatus> = downloadStatusAdapter.getInitialState()
}

export const filesSlice = createSlice({
    initialState: { ...new FilesState() },
    name: StoreKeys.Files,
    reducers: {
        updateDownloadStatus: (state, action: PayloadAction<DownloadStatus>) => {
            downloadStatusAdapter.upsertOne(state.downloadStatus, action.payload)
        },
        removeDownloadStatus: (state, action: PayloadAction<RemoveDownloadStatus>) => {
            const { cid } = action.payload
            downloadStatusAdapter.removeOne(state.downloadStatus, cid)
        },
        cancelDownload: (state, _action: PayloadAction<CancelDownload>) => state,
        uploadFile: (state, _action: PayloadAction<FileContent>) => state,
        broadcastHostedFile: (state, _action: PayloadAction<FileMetadata>) => state,
        downloadFile: (state, _action: PayloadAction<FileMetadata>) => state,
        updateMessageMedia: (state, _action: PayloadAction<FileMetadata>) => state,
        checkForMissingFiles: (state, _action: PayloadAction<CommunityId>) => state,
        deleteFilesFromChannel: (state, _action: PayloadAction<DeleteFilesFromChannelPayload>) => state,
    },
})

export const filesActions = filesSlice.actions
export const filesReducer = filesSlice.reducer
