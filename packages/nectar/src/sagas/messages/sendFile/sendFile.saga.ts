import { PayloadAction } from '@reduxjs/toolkit'
import { Socket } from 'socket.io-client'
import { put } from 'typed-redux-saga'
import { messagesActions } from '../messages.slice'
import { MessageType } from '../messages.types'

export function* sendFileSaga(
  socket: Socket,
  action: PayloadAction<ReturnType<typeof messagesActions.sendMessage>['payload']>
): Generator {
  const payload = action.payload
  payload['type'] = MessageType.IMAGE
  console.log('sendFileSaga', payload)
  yield* put(messagesActions.sendMessage(payload))
}
