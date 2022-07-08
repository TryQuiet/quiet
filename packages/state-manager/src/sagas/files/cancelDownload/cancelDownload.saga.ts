import { Socket } from 'socket.io-client'
import { PayloadAction } from '@reduxjs/toolkit'
import { select, put, apply } from 'typed-redux-saga'
import { SocketActionTypes } from '../../socket/const/actionTypes'
import { identitySelectors } from '../../identity/identity.selectors'
import { filesActions } from '../files.slice'
import { DownloadState } from '../files.types'

export function* cancelDownloadSaga(
  socket: Socket,
  action: PayloadAction<ReturnType<typeof filesActions.cancelDownload>['payload']>
): Generator {
  const identity = yield* select(identitySelectors.currentIdentity)

  const { cid } = action.payload

  yield* put(filesActions.updateDownloadStatus({
    cid: cid,
    downloadState: DownloadState.Canceling
  }))

  yield* apply(socket, socket.emit, [
    SocketActionTypes.CANCEL_DOWNLOAD,
    {
      peerId: identity.peerId.id,
      cid: cid
    }
  ])
}
