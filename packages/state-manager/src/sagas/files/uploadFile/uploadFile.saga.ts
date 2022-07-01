import { Socket } from 'socket.io-client'
import { PayloadAction } from '@reduxjs/toolkit'
import { select, call, put, apply } from 'typed-redux-saga'
import { SocketActionTypes } from '../../socket/const/actionTypes'
import { identitySelectors } from '../../identity/identity.selectors'
import { DownloadState, FileMetadata, imagesExtensions } from '../../files/files.types'
import { filesActions } from '../files.slice'
import { MessageType } from '../../messages/messages.types'
import { messagesActions } from '../../messages/messages.slice'
import { generateMessageId } from '../../messages/utils/message.utils'
import { publicChannelsSelectors } from '../../publicChannels/publicChannels.selectors'

export function* uploadFileSaga(
  socket: Socket,
  action: PayloadAction<ReturnType<typeof filesActions.uploadFile>['payload']>
): Generator {
  const identity = yield* select(identitySelectors.currentIdentity)
  const currentChannel = yield* select(publicChannelsSelectors.currentChannel)

  const id = yield* call(generateMessageId)

  const file: FileMetadata = {
    ...action.payload,
    cid: `uploading_${id}`,
    message: {
      id: id,
      channelAddress: currentChannel.address
    }
  }

  let type: MessageType

  if (imagesExtensions.includes(file.ext)) {
    type = MessageType.Image
  } else {
    type = MessageType.File
  }

  yield* put(
    messagesActions.sendMessage({
      id: id,
      message: '',
      type: type,
      media: { 
        ...action.payload,
        cid: `uploading_${id}`,
        message: {
          id: id,
          channelAddress: currentChannel.address
        }
      }
    })
  )

  yield* put(
    filesActions.updateDownloadStatus({
      cid: `uploading_${id}`,
      downloadState: DownloadState.Uploading,
      downloadProgress: undefined
    })
  )

  yield* apply(socket, socket.emit, [
    SocketActionTypes.UPLOAD_FILE,
    {
      file: file,
      peerId: identity.peerId.id
    }
  ])
}
