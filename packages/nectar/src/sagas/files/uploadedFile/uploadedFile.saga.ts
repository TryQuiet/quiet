import { PayloadAction } from '@reduxjs/toolkit'
import { Socket } from 'socket.io-client'
import { put } from 'typed-redux-saga'
import { messagesActions } from '../../messages/messages.slice'
import { MessageType } from '../../messages/messages.types'

export function* uploadedFileSaga(
  socket: Socket,
  action: PayloadAction<ReturnType<typeof messagesActions.uploadedFile>['payload']>
): Generator {

  console.log('uploadedFileSaga', action.payload)
  yield* put(messagesActions.sendMessage({
    type: MessageType.Image,
    message: action.payload.buffer,
    cid: action.payload.cid
  }))
}
