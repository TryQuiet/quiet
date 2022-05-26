import { PayloadAction } from '@reduxjs/toolkit'
import { Socket } from 'socket.io-client'
import { put } from 'typed-redux-saga'
import { messagesActions } from '../../messages/messages.slice'
import { MessageType } from '../../messages/messages.types'

export function* sendFileSaga(
  action: PayloadAction<ReturnType<typeof messagesActions.sendMessage>['payload']>
): Generator {
  const payload = action.payload
  payload['type'] = MessageType.Image
  yield* put(messagesActions.sendMessage(payload))
}
