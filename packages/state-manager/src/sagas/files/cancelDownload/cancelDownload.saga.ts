import { applyEmitParams, type Socket } from '../../../types'
import { type PayloadAction } from '@reduxjs/toolkit'
import { select, put, apply } from 'typed-redux-saga'
import { identitySelectors } from '../../identity/identity.selectors'
import { filesActions } from '../files.slice'
import { DownloadState, SocketActions } from '@quiet/types'

export function* cancelDownloadSaga(
  socket: Socket,
  action: PayloadAction<ReturnType<typeof filesActions.cancelDownload>['payload']>
): Generator {
  const identity = yield* select(identitySelectors.currentIdentity)
  if (!identity) return

  const { mid, cid } = action.payload

  yield* put(
    filesActions.updateDownloadStatus({
      mid,
      cid,
      downloadState: DownloadState.Canceling,
    })
  )

  yield* apply(
    socket,
    socket.emit,
    applyEmitParams(SocketActions.CANCEL_DOWNLOAD, {
      peerId: identity.networkInfo.peerId.id,
      mid,
    })
  )
}
