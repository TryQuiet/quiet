import { applyEmitParams, type Socket } from '../../../types'
import { type PayloadAction } from '@reduxjs/toolkit'
import { select, put, apply } from 'typed-redux-saga'
import { identitySelectors } from '../../identity/identity.selectors'
import { filesActions } from '../files.slice'
import { DownloadState, SocketActionTypes } from '@quiet/types'
import { loggingHandler, LoggerModuleName } from '../../../utils/logger'

const LOGGER = loggingHandler.initLogger([LoggerModuleName.FILES, LoggerModuleName.SAGA, 'cancelDownload'])

export function* cancelDownloadSaga(
  socket: Socket,
  action: PayloadAction<ReturnType<typeof filesActions.cancelDownload>['payload']>
): Generator {
  const identity = yield* select(identitySelectors.currentIdentity)
  if (!identity) {
    LOGGER.warn(`No identity found, can't cancel download`)
    return
  }

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
    applyEmitParams(SocketActionTypes.CANCEL_DOWNLOAD, {
      peerId: identity.peerId.id,
      mid,
    })
  )
}
