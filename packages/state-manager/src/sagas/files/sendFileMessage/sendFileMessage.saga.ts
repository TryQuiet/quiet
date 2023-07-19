import { applyEmitParams, type Socket } from '../../../types'
import { type PayloadAction } from '@reduxjs/toolkit'
import { select, apply } from 'typed-redux-saga'
import { identitySelectors } from '../../identity/identity.selectors'
import { messagesActions } from '../../messages/messages.slice'
import { SocketActionTypes } from '@quiet/types'
import { messagesSelectors } from '../../messages/messages.selectors'

export function* sendFileSaga(
  socket: Socket,
  action: PayloadAction<ReturnType<typeof messagesActions.incomingMessages>['payload']>
) {
  const messages = action.payload.messages
  const message = messages[0]
  if (!message.media || !action.payload.isVerified) return

  const sendingStatus = yield* select(messagesSelectors.messageSendingStatusById(message.id))
  if (!sendingStatus) return

  const identity = yield* select(identitySelectors.currentIdentity)
  if (!identity) return

  yield* apply(
    socket,
    socket.emit,
    applyEmitParams(SocketActionTypes.UPLOAD_FILE, {
      file: message.media,
      peerId: identity.peerId.id,
    })
  )
}
