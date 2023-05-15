import { put, select } from 'typed-redux-saga'
import { filesActions } from '../files.slice'
import { filesSelectors } from '../files.selectors'
import { DownloadState } from '../files.types'

export function* resetTransferSpeedSaga(): Generator {
  const downloadStatuses = yield* select(filesSelectors.downloadStatuses)

  for (const status of Object.values(downloadStatuses)) {
    if (status?.downloadState === DownloadState.Downloading && status?.downloadProgress?.transferSpeed) {
      yield* put(
        filesActions.updateDownloadStatus({
          ...status,
          downloadProgress: {
            ...status.downloadProgress,
            transferSpeed: 0
          }
        })
      )
    }
  }
}
