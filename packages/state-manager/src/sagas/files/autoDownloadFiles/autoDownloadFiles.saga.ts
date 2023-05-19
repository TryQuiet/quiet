import { PayloadAction } from '@reduxjs/toolkit'
import { messagesActions } from '../../messages/messages.slice'
import { MessageType } from '../../messages/messages.types'
import { apply, put, select } from 'typed-redux-saga'
import { SocketActionTypes } from '../../socket/const/actionTypes'
import { identitySelectors } from '../../identity/identity.selectors'
import { messagesSelectors } from '../../messages/messages.selectors'
import { AUTODOWNLOAD_SIZE_LIMIT } from '../../../constants'
import { filesActions } from '../files.slice'
import { DownloadState } from '../files.types'
import { applyEmitParams, Socket } from '../../../types'

export function* autoDownloadFilesSaga(
  socket: Socket,
  action: PayloadAction<ReturnType<typeof messagesActions.incomingMessages>['payload']>
): Generator {
  const identity = yield* select(identitySelectors.currentIdentity)

  const { messages } = action.payload

  for (const message of messages) {
    // Proceed for images and files only
    if (message.type !== MessageType.Image && message.type !== MessageType.File) return

    const channelMessages = yield* select(
      messagesSelectors.publicChannelMessagesEntities(message.channelId)
    )

    const draft = channelMessages[message.id]

    // Do not download if already present in local file system
    if (draft?.media?.path) return

    // Do not autodownload above certain size
    if (message.media.size > AUTODOWNLOAD_SIZE_LIMIT) {
      yield* put(
        filesActions.updateDownloadStatus({
          mid: message.id,
          cid: message.media.cid,
          downloadState: DownloadState.Ready
        })
      )
      return
    }

    yield* put(
      filesActions.updateDownloadStatus({
        mid: message.id,
        cid: message.media.cid,
        downloadState: DownloadState.Queued
      })
    )

    yield* apply(
      socket,
      socket.emit,
      applyEmitParams(SocketActionTypes.DOWNLOAD_FILE, {
        peerId: identity.peerId.id,
        metadata: message.media
      })
    )
  }
}
