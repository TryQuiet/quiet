import { PayloadAction } from '@reduxjs/toolkit'
import { Socket } from 'socket.io-client'
import { select, apply } from 'typed-redux-saga'
import { identitySelectors } from '../../identity/identity.selectors'
import { messagesSelectors } from '../../messages/messages.selectors'
import { SocketActionTypes } from '../../socket/const/actionTypes'
import { filesActions } from '../files.slice'

export function* broadcastHostedFileSaga(
  socket: Socket,
  action: PayloadAction<ReturnType<typeof filesActions.broadcastHostedFile>['payload']>
): Generator {
  const identity = yield* select(identitySelectors.currentIdentity)

  const channelMessages = yield* select(messagesSelectors.currentPublicChannelMessagesEntities)
  const message = channelMessages[action.payload.message.id]

  yield* apply(socket, socket.emit, [
    SocketActionTypes.SEND_MESSAGE,
    {
      peerId: identity.peerId.id,
      message: {
        ...message,
        media: {
          ...action.payload,
          path: null
        }
      }
    }
  ])
}
