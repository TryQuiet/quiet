import { Socket } from 'socket.io-client'
import { PayloadAction } from '@reduxjs/toolkit'
import { messagesActions } from '../messages.slice'
import { MessageType } from '../messages.types'
import { apply, select } from 'typed-redux-saga'
import { SocketActionTypes } from '../../socket/const/actionTypes'
import { Identity } from '../../identity/identity.types'
import { identitySelectors } from '../../identity/identity.selectors'

export function* checkIsImageSaga(
  socket: Socket,
  action: PayloadAction<ReturnType<typeof messagesActions.incomingMessages>['payload']>
): Generator {
  const identity: Identity = yield* select(identitySelectors.currentIdentity)

  const messages = action.payload.messages
  for (const message of messages) {
    console.log('checkIsImageSaga', message)
    if (message.type === MessageType.IMAGE) {
      yield* apply(socket, socket.emit, [
        SocketActionTypes.DOWNLOAD_FILE, {
          cid: message.cid,
          peerId: identity.peerId.id
        }
      ])
    }
  }
}
