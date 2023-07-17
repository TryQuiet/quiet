import { type PayloadAction } from '@reduxjs/toolkit'
import { applyEmitParams, type Socket } from '../../../types'

import { select, apply } from 'typed-redux-saga'
import { identitySelectors } from '../../identity/identity.selectors'
import { messagesSelectors } from '../../messages/messages.selectors'
import { type filesActions } from '../files.slice'
import { instanceOfChannelMessage, SocketActionTypes } from '@quiet/types'

export function* broadcastHostedFileSaga(
  socket: Socket,
  action: PayloadAction<ReturnType<typeof filesActions.broadcastHostedFile>['payload']>
): Generator {
  console.log(`(broadcastHostedFileSaga) start`)
  const identity = yield* select(identitySelectors.currentIdentity)
  if (!identity) return

  const channelMessages = yield* select(
    messagesSelectors.publicChannelMessagesEntities(action.payload.message.channelId)
  )

  const message = channelMessages[action.payload.message.id]

  if (!message || !instanceOfChannelMessage(message)) {
    console.error(
      `Cannot broadcast message after uploading. Draft ${action.payload.message.id} from #${action.payload.message.channelId} does not exist in local storage.`
    )
    return
  }

  console.log(`(broadcastHostedFileSaga) Broadcasting message ${action.payload.message.id} after uploading`)

  yield* apply(
    socket,
    socket.emit,
    applyEmitParams(SocketActionTypes.SEND_MESSAGE, {
      peerId: identity.peerId.id,
      message: {
        ...message,
        media: {
          ...action.payload,
          path: null,
        },
      },
    })
  )
}
