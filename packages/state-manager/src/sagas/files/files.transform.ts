import { createTransform } from 'redux-persist'
import { StoreKeys } from '../store.keys'
import { downloadStatusAdapter } from './files.adapter'
import { FilesState } from './files.slice'
import { DownloadState, DownloadStatus } from './files.types'
import { isDefined } from '@quiet/common'

export const FilesTransform = createTransform(
  (inboundState: FilesState, _key) => {
    return { ...inboundState }
  },
  (outboundState: FilesState, _key) => {
    const downloadStatuses = Object.values(outboundState.downloadStatus.entities).filter(isDefined)
    const updatedStatuses: DownloadStatus[] = downloadStatuses.reduce((result: DownloadStatus[], status) => {
      const downloadState = status.downloadState
      const entry: DownloadStatus = {
        ...status,
        downloadState: downloadState !== DownloadState.Canceling ? downloadState : DownloadState.Canceled
      }
      result.push(entry)
      return result
    }, [])
    return {
      ...outboundState,
      downloadStatus: downloadStatusAdapter.setAll(
        downloadStatusAdapter.getInitialState(),
        updatedStatuses
      )
    }
  },
  { whitelist: [StoreKeys.Files] }
)
