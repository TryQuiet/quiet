import { type PayloadAction } from '@reduxjs/toolkit'
import { applyEmitParams, type Socket } from '../../../types'

import { select, apply, put } from 'typed-redux-saga'
import { identitySelectors } from '../../identity/identity.selectors'
import { messagesSelectors } from '../../messages/messages.selectors'
import { filesActions } from '../files.slice'
import { ChannelMessage, instanceOfChannelMessage, SocketActions, PROFILE_PHOTO_CHANNEL_ID } from '@quiet/types'
import { createLogger } from '../../../utils/logger'

const logger = createLogger('broadcastHostedFileSaga')

export function* broadcastHostedFileSaga(
  socket: Socket,
  action: PayloadAction<ReturnType<typeof filesActions.broadcastHostedFile>['payload']>
): Generator {
  const payload = action.payload
  if (payload.message.channelId === PROFILE_PHOTO_CHANNEL_ID) {
    logger.info('Skipping message broadcast for profile photo attachment')
    yield* put(
      filesActions.setProfilePhotoMetadata({
        messageId: payload.message.id,
        fileMetadata: payload,
      })
    )
    return
  }

  logger.info('Broadcasting hosted file', payload)
  const identity = yield* select(identitySelectors.currentIdentity)
  if (!identity) return

  const channelMessages = yield* select(messagesSelectors.publicChannelMessagesEntities(payload.message.channelId))

  const message = channelMessages[payload.message.id]

  if (!message || !instanceOfChannelMessage(message)) {
    logger.error(
      `Cannot broadcast message after attaching. Draft ${payload.message.id} from #${payload.message.channelId} does not exist in local storage.`
    )
    return
  }

  const sendMessagePayload: ChannelMessage = {
    ...message,
    media: {
      ...payload,
      path: null,
    },
  }

  yield* apply(socket, socket.emit, applyEmitParams(SocketActions.SEND_MESSAGE, sendMessagePayload))
}
