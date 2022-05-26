import { PayloadAction } from '@reduxjs/toolkit'
import { put } from 'typed-redux-saga'
import { messagesActions } from '../../messages/messages.slice'
import { MessageType } from '../../messages/messages.types'

export function* uploadedFileSaga(
  action: PayloadAction<ReturnType<typeof messagesActions.uploadedFile>['payload']>
): Generator {
  yield* put(messagesActions.sendMessage({
    message: '',
    type: MessageType.Image,
    media: action.payload
  }))
}
