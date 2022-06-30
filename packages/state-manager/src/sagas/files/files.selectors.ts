import { Dictionary } from '@reduxjs/toolkit'
import { createSelector } from 'reselect'
import { currentChannelMessages } from '../publicChannels/publicChannels.selectors'
import { StoreKeys } from '../store.keys'
import { CreatedSelectors, StoreState } from '../store.types'
import { downloadStatusAdapter } from './files.adapter'
import { DownloadState, DownloadStatus } from './files.types'

const filesSlice: CreatedSelectors[StoreKeys.Files] = (state: StoreState) => state[StoreKeys.Files]

export const selectDownloadStatuses = createSelector(filesSlice, state =>
  downloadStatusAdapter.getSelectors().selectEntities(state.downloadStatus)
)

// Map download statuses to currently displayed messages
export const downloadStatusesMapping = createSelector(
  selectDownloadStatuses,
  currentChannelMessages,
  (statuses, messages) => {
    const mapping: Dictionary<DownloadStatus> = {}
    for (const message of messages) {
      if (message.media?.cid) {
        // Prepare default status basing on the presence of a file path, in case of no corresponding status in the local store
        const defaultStatus: DownloadStatus = {
          cid: message.media.cid,
          downloadState: message.media.path ? DownloadState.Completed : DownloadState.Ready,
          downloadProgress: undefined
        }
        mapping[message.id] = statuses[message.media.cid] || defaultStatus
      }
    }
    return mapping
  }
)

export const filesSelectors = {
    downloadStatusesMapping
}
