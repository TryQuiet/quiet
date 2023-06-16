import { applyEmitParams, type Socket } from '../../../types'
import { type PayloadAction } from '@reduxjs/toolkit'
import { apply, put, select } from 'typed-redux-saga'
import { identitySelectors } from '../../identity/identity.selectors'
import { filesActions } from '../files.slice'
import { DownloadState, SocketActionTypes } from '@quiet/types'

export function* downloadFileSaga(
  socket: Socket,
  action: PayloadAction<ReturnType<typeof filesActions.downloadFile>['payload']>
): Generator {
  const identity = yield* select(identitySelectors.currentIdentity)
  if (!identity) return

  const media = action.payload

  yield* put(
    filesActions.updateDownloadStatus({
      mid: media.message.id,
      cid: media.cid,
      downloadState: DownloadState.Queued
    })
  )

  yield* apply(
    socket,
    socket.emit,
    applyEmitParams(SocketActionTypes.DOWNLOAD_FILE, {
      peerId: identity.peerId.id,
      metadata: media
    })
  )
}
