import { type Socket, applyEmitParams } from '../../../types'
import { type PayloadAction } from '@reduxjs/toolkit'
import { call, select, apply, put, delay, take } from 'typed-redux-saga'
import { publicChannelsActions } from '../../publicChannels/publicChannels.slice'
import { publicChannelsSelectors } from '../../publicChannels/publicChannels.selectors'
import { messagesActions } from '../messages.slice'
import { generateMessageId, getCurrentTime } from '../utils/message.utils'
import { type ChannelMessage, MessageType, SendingStatus, SocketActionTypes } from '@quiet/types'
import { createLogger } from '../../../utils/logger'
import { identitySelectors } from '../../identity/identity.selectors'
import { identityActions } from '../../identity/identity.slice'

const logger = createLogger('sendMessageSaga')

export function* sendMessageSaga(
  socket: Socket,
  action: PayloadAction<ReturnType<typeof messagesActions.sendMessage>['payload']>
): Generator {
  const generatedMessageId = yield* call(generateMessageId)
  const id = action.payload.id || generatedMessageId
  let identity = yield* select(identitySelectors.currentIdentity)
  while (!identity || !identity.userId || !identity.nickname) {
    logger.info('Identity not present, waiting for identity to be added.', identity)
    // This will block until the addNewIdentity action is dispatched.
    const actionIdentity: ReturnType<typeof identityActions.updateIdentity> = yield* take(
      identityActions.updateIdentity
    )
    identity = yield* select(identitySelectors.currentIdentity)
    logger.info('Identity updated', identity)
  }

  logger.info('Identity present', identity)

  const currentChannelId = yield* select(publicChannelsSelectors.currentChannelId)
  const channelId = action.payload.channelId || currentChannelId
  if (!channelId) {
    logger.error(`Failed to send message ${id} - channel ID is missing`)
    return
  }

  logger.info(`Sending message ${id} to channel ${channelId}`)

  const createdAt = yield* call(getCurrentTime)

  const message: ChannelMessage = {
    id,
    userId: identity.userId,
    author: identity.nickname,
    type: action.payload.type || MessageType.Basic,
    message: action.payload.message,
    media: action.payload.media,
    createdAt,
    channelId,
  }

  // Grey out message until saved in db
  logger.info('Adding pending message status')
  yield* put(
    messagesActions.addMessagesSendingStatus({
      message: message,
      status: SendingStatus.Pending,
    })
  )

  // Mark own message as properly signed
  yield* put(
    messagesActions.addMessageVerificationStatus({
      id: message.id,
      isVerified: true,
    })
  )

  // Display sent message immediately, to improve user experience
  logger.info('Adding message to Redux store on send', message.id)
  yield* put(
    messagesActions.addMessages({
      messages: [message],
      isVerified: true,
    })
  )

  const isUploadingFileMessage = action.payload.media?.cid?.includes('uploading')
  if (isUploadingFileMessage) {
    logger.info(`Waiting to send message ${id} - file upload is in progress`)
    return // Do not broadcast message until file is uploaded
  }

  // Wait until we have subscribed to the channel
  //
  // TODO: I think we probably want to revise how we are sending
  // messages by having the backend handling queueing and retrying
  // (in a durable way).
  while (true) {
    const subscribedChannels = yield* select(publicChannelsSelectors.subscribedChannels)
    logger.info('Subscribed channels', subscribedChannels)
    if (subscribedChannels.includes(channelId)) {
      logger.info(`Channel ${channelId} subscribed`)
      break
    }
    logger.error(`Waiting to send message ${id} - channel not subscribed`)
    yield* take(publicChannelsActions.setChannelSubscribed)
    logger.info('New channel subscribed')
  }

  logger.info('Emitting SEND_MESSAGE', id)
  yield* apply(
    socket,
    socket.emit,
    applyEmitParams(SocketActionTypes.SEND_MESSAGE, {
      message,
    })
  )
  logger.info(`Sent message ${id}`)
}
