import { put, select } from 'typed-redux-saga'
import { filesActions } from '../files.slice'
import { filesSelectors } from '../files.selectors'
import { PayloadAction } from '@reduxjs/toolkit'
import { networkActions } from '../../network/network.slice'
import { DownloadState } from '@quiet/types'

export function* resetTransferSpeedSaga(
  _action: PayloadAction<ReturnType<typeof networkActions.addInitializedCommunity>['payload']>
  ): Generator {
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
