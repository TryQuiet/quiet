import { PayloadAction } from '@reduxjs/toolkit'
import { put } from 'typed-redux-saga'
import { messagesActions } from '../../messages/messages.slice'
import { MessageType } from '../../messages/messages.types'
import { imagesExtensions } from '../files.types'

export function* uploadedFileSaga(
  action: PayloadAction<ReturnType<typeof messagesActions.uploadedFile>['payload']>
): Generator {
  const { ext } = action.payload

  let type: MessageType

  if (imagesExtensions.includes(ext)) {
    type = MessageType.Image
  } else {
    type = MessageType.File
  }

  yield* put(
    messagesActions.sendMessage({
      message: '',
      type: type,
      media: action.payload
    })
  )
}
