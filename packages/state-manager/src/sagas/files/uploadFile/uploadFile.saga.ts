import { Socket } from 'socket.io-client'
import { PayloadAction } from '@reduxjs/toolkit'
import { select, call, put, apply } from 'typed-redux-saga'
import { SocketActionTypes } from '../../socket/const/actionTypes'
import { identitySelectors } from '../../identity/identity.selectors'
import { Identity } from '../../identity/identity.types'
import { DownloadState, FileContent, imagesExtensions } from '../../files/files.types'
import { filesActions } from '../files.slice'
import { MessageType } from '../../messages/messages.types'
import { messagesActions } from '../../messages/messages.slice'
import { generateMessageId } from '../../messages/utils/message.utils'

export function* uploadFileSaga(
  socket: Socket,
  action: PayloadAction<ReturnType<typeof filesActions.uploadFile>['payload']>
): Generator {
  const identity: Identity = yield* select(identitySelectors.currentIdentity)

  const fileContent: FileContent = action.payload

  let type: MessageType

  if (imagesExtensions.includes(fileContent.ext)) {
    type = MessageType.Image
  } else {
    type = MessageType.File
  }

  const id = yield* call(generateMessageId)

  yield* put(
    messagesActions.sendMessage({
      id: id,
      message: '',
      type: type,
      media: { 
        ...action.payload,
        cid: `uploading_${id}`
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
      file: fileContent,
      peerId: identity.peerId.id
    }
  ])
}
