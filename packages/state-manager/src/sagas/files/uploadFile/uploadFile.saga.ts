import { applyEmitParams, type Socket } from '../../../types'
import { type PayloadAction } from '@reduxjs/toolkit'
import { select, call, put, apply } from 'typed-redux-saga'
import { identitySelectors } from '../../identity/identity.selectors'
import { filesActions } from '../files.slice'
import { messagesActions } from '../../messages/messages.slice'
import { generateMessageId } from '../../messages/utils/message.utils'
import { publicChannelsSelectors } from '../../publicChannels/publicChannels.selectors'
import { DownloadState, type FileMetadata, imagesExtensions, MessageType, SocketActionTypes } from '@quiet/types'

export function* uploadFileSaga(
  socket: Socket,
  action: PayloadAction<ReturnType<typeof filesActions.uploadFile>['payload']>
): Generator {
  const identity = yield* select(identitySelectors.currentIdentity)

  const currentChannel = yield* select(publicChannelsSelectors.currentChannelId)
  if (!identity || !currentChannel) return

  const id = yield* call(generateMessageId)

  const media: FileMetadata = {
    ...action.payload,
    cid: `uploading_${id}`,
    message: {
      id,
      channelId: currentChannel
    }
  }

  let type: MessageType

  if (imagesExtensions.includes(media.ext)) {
    type = MessageType.Image
  } else {
    type = MessageType.File
  }

  yield* put(
    messagesActions.sendMessage({
      id,
      message: '',
      type,
      media
    })
  )

  yield* put(
    filesActions.updateDownloadStatus({
      mid: id,
      cid: `uploading_${id}`,
      downloadState: DownloadState.Uploading,
      downloadProgress: undefined
    })
  )

  yield* apply(
    socket,
    socket.emit,
    applyEmitParams(SocketActionTypes.UPLOAD_FILE, {
      file: media,
      peerId: identity.peerId.id
    })
  )
}
