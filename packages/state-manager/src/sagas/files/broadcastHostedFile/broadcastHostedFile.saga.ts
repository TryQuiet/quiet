import { PayloadAction } from '@reduxjs/toolkit'
import { applyEmitParams, Socket } from '../../../types'

import { select, apply } from 'typed-redux-saga'
import { identitySelectors } from '../../identity/identity.selectors'
import { messagesSelectors } from '../../messages/messages.selectors'
import { instanceOfChannelMessage } from '../../publicChannels/publicChannels.types'
import { SocketActionTypes } from '../../socket/const/actionTypes'
import { filesActions } from '../files.slice'

export function* broadcastHostedFileSaga(
  socket: Socket,
  action: PayloadAction<ReturnType<typeof filesActions.broadcastHostedFile>['payload']>
): Generator {
  const identity = yield* select(identitySelectors.currentIdentity)
  if (!identity) return

  const channelMessages = yield* select(
    messagesSelectors.publicChannelMessagesEntities(action.payload.message.channelAddress)
  )

  const message = channelMessages[action.payload.message.id]

  if (!message || !instanceOfChannelMessage(message)) {
    console.error(
      `Cannot broadcast message after uploading. Draft ${action.payload.message.id} from #${action.payload.message.channelAddress} does not exist in local storage.`
    )
    return
  }

  yield* apply(
    socket,
    socket.emit,
    applyEmitParams(SocketActionTypes.SEND_MESSAGE, {
      peerId: identity.peerId.id,
      message: {
        ...message,
        media: {
          ...action.payload,
          path: null
        }
      }
    })
  )
}
