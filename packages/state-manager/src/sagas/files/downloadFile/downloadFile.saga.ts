import { Socket } from 'socket.io-client'
import { PayloadAction } from '@reduxjs/toolkit'
import { messagesActions } from '../../messages/messages.slice'
import { MessageType } from '../../messages/messages.types'
import { apply, select } from 'typed-redux-saga'
import { SocketActionTypes } from '../../socket/const/actionTypes'
import { identitySelectors } from '../../identity/identity.selectors'
import { messagesSelectors } from '../../messages/messages.selectors'

export function* downloadFileSaga(
  socket: Socket,
  action: PayloadAction<ReturnType<typeof messagesActions.incomingMessages>['payload']>
): Generator {
  const identity = yield* select(identitySelectors.currentIdentity)

  const channelMessages = yield* select(messagesSelectors.currentPublicChannelMessagesEntities)

  const { messages } = action.payload

  for (const message of messages) {
    // Proceed for images and files only
    if (message.type === MessageType.Image || message.type === MessageType.File) {
      
      const isAlreadyLocallyStored = channelMessages[message.id]?.media?.path ? true : false

      // Do not download if already present in local file system
      if (!isAlreadyLocallyStored) {
        yield* apply(socket, socket.emit, [
          SocketActionTypes.DOWNLOAD_FILE,
          {
            peerId: identity.peerId.id,
            metadata: message.media
          }
        ])
      }
    }
  }
}
