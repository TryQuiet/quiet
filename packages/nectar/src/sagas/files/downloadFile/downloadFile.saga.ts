import { Socket } from 'socket.io-client'
import { PayloadAction } from '@reduxjs/toolkit'
import { messagesActions } from '../../messages/messages.slice'
import { MessageType } from '../../messages/messages.types'
import { apply, select } from 'typed-redux-saga'
import { SocketActionTypes } from '../../socket/const/actionTypes'
import { Identity } from '../../identity/identity.types'
import { identitySelectors } from '../../identity/identity.selectors'

export function* downloadFileSaga(
  socket: Socket,
  action: PayloadAction<ReturnType<typeof messagesActions.incomingMessages>['payload']>
): Generator {
  const identity: Identity = yield* select(identitySelectors.currentIdentity)

  const { messages } = action.payload

  for (const message of messages) {
    if (message.type === MessageType.Image) {
      if (message.media?.path) return // File is locally stored already
      yield* apply(socket, socket.emit, [
        SocketActionTypes.DOWNLOAD_FILE, {
          metadata: message.media,
          peerId: identity.peerId.id
        }
      ])
    }
  }
}
