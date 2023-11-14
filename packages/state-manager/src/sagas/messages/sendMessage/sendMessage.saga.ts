import { type Socket, applyEmitParams } from '../../../types'
import { type PayloadAction } from '@reduxjs/toolkit'
import { sign, loadPrivateKey, pubKeyFromCsr } from '@quiet/identity'
import { call, select, apply, put } from 'typed-redux-saga'
import { arrayBufferToString } from 'pvutils'
import { config } from '../../users/const/certFieldTypes'
import { identitySelectors } from '../../identity/identity.selectors'
import { publicChannelsSelectors } from '../../publicChannels/publicChannels.selectors'
import { messagesActions } from '../messages.slice'
import { generateMessageId, getCurrentTime } from '../utils/message.utils'
import { type ChannelMessage, MessageType, SendingStatus, SocketActionTypes } from '@quiet/types'

export function* sendMessageSaga(
  socket: Socket,
  action: PayloadAction<ReturnType<typeof messagesActions.sendMessage>['payload']>
): Generator {
  const identity = yield* select(identitySelectors.currentIdentity)
  if (!identity?.userCsr) return

  const pubKey = yield* call(pubKeyFromCsr, identity.userCsr.userCsr)
  const keyObject = yield* call(loadPrivateKey, identity.userCsr.userKey, config.signAlg)
  const signatureArrayBuffer = yield* call(sign, action.payload.message, keyObject)
  const signature = yield* call(arrayBufferToString, signatureArrayBuffer)

  const currentChannelId = yield* select(publicChannelsSelectors.currentChannelId)

  const createdAt = yield* call(getCurrentTime)

  const generatedMessageId = yield* call(generateMessageId)

  const id = action.payload.id || generatedMessageId

  const channelId = action.payload.channelId || currentChannelId
  if (!channelId) {
    console.error(`Could not send message with id ${id}, no channel id`)
    return
  }

  const message: ChannelMessage = {
    id,
    type: action.payload.type || MessageType.Basic,
    message: action.payload.message,
    media: action.payload.media,
    createdAt,
    channelId,
    signature,
    pubKey,
  }

  // Grey out message until saved in db
  yield* put(
    messagesActions.addMessagesSendingStatus({
      message: message,
      status: SendingStatus.Pending,
    })
  )

  // Mark own message as properly signed
  yield* put(
    messagesActions.addMessageVerificationStatus({
      publicKey: message.pubKey,
      signature: message.signature,
      isVerified: true,
    })
  )

  // Display sent message immediately, to improve user experience
  yield* put(
    messagesActions.incomingMessages({
      messages: [message],
      isVerified: true,
    })
  )

  const isUploadingFileMessage = action.payload.media?.cid?.includes('uploading')
  if (isUploadingFileMessage) return // Do not broadcast message until file is uploaded

  yield* apply(
    socket,
    socket.emit,
    applyEmitParams(SocketActionTypes.SEND_MESSAGE, {
      peerId: identity.peerId.id,
      message,
    })
  )
}
