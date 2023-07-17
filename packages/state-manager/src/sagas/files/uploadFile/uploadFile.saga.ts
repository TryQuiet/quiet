import { applyEmitParams, type Socket } from '../../../types'
import { type PayloadAction } from '@reduxjs/toolkit'
import { select, call, put, apply, take } from 'typed-redux-saga'
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
  console.log('UploadFileSaga start', action.payload.path)
  const identity = yield* select(identitySelectors.currentIdentity)

  const currentChannel = yield* select(publicChannelsSelectors.currentChannelId)
  if (!identity || !currentChannel) return

  const id = yield* call(generateMessageId)
  console.log('UploadFileSaga - generateMessageId', id, action.payload.path)
  const media: FileMetadata = {
    ...action.payload,
    cid: `uploading_${id}`,
    message: {
      id,
      channelId: currentChannel,
    },
  }

  let type: MessageType

  if (imagesExtensions.includes(media.ext)) {
    type = MessageType.Image
  } else {
    type = MessageType.File
  }
  console.log('UploadFileSaga - sendingMessage', id)
  yield* put(
    messagesActions.sendMessage({
      id,
      message: '',
      type,
      media,
    })
  )
  console.log('UploadFileSaga - updateDownloadStatus', id)
  yield* put(
    filesActions.updateDownloadStatus({
      mid: id,
      cid: `uploading_${id}`,
      downloadState: DownloadState.Uploading,
      downloadProgress: undefined,
    })
  )
  console.log('UploadFileSaga - wait for addMessagesSendingStatus', id)
  yield* take(messagesActions.addMessagesSendingStatus) // FIXME: Sending files on mobile Works with this workaround
  console.log('UploadFileSaga - UPLOAD_FILE', id)

  yield* apply(
    socket,
    socket.emit,
    applyEmitParams(SocketActionTypes.UPLOAD_FILE, {
      file: media,
      peerId: identity.peerId.id,
    })
  )
}
