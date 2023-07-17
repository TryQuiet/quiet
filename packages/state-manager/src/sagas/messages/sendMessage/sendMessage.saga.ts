import { type Socket, applyEmitParams } from '../../../types'
import { type PayloadAction } from '@reduxjs/toolkit'
import { keyFromCertificate, parseCertificate, sign, loadPrivateKey } from '@quiet/identity'
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
  console.log('SendMessageSaga', action.payload.id)
  const identity = yield* select(identitySelectors.currentIdentity)
  console.log('sendMessageSaga - identity', Boolean(identity))
  if (!identity?.userCsr || !identity.userCertificate) return

  const certificate = identity.userCertificate

  const parsedCertificate = yield* call(parseCertificate, certificate)
  console.log('sendMessageSaga - parsedCertificate')
  const pubKey = yield* call(keyFromCertificate, parsedCertificate)
  console.log('sendMessageSaga - pubKey')
  const keyObject = yield* call(loadPrivateKey, identity.userCsr.userKey, config.signAlg)
  console.log('sendMessageSaga - keyObject')

  const signatureArrayBuffer = yield* call(sign, action.payload.message, keyObject)
  console.log('sendMessageSaga - signatureArrayBuffer')
  const signature = yield* call(arrayBufferToString, signatureArrayBuffer)
  console.log('sendMessageSaga - signature')

  const currentChannelId = yield* select(publicChannelsSelectors.currentChannelId)
  console.log('sendMessageSaga - currentChannelId', currentChannelId)

  const createdAt = yield* call(getCurrentTime)
  console.log('sendMessageSaga - createdAt', createdAt)

  const generatedMessageId = yield* call(generateMessageId)

  const id = action.payload.id || generatedMessageId
  console.log('sendMessageSaga - id', id)

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
  console.log('SendMessageSaga - addMessagesSendingStatus', action.payload.id)
  yield* put(
    messagesActions.addMessagesSendingStatus({
      id: message.id,
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
  console.log('SendMessageSaga - incomingMessages', action.payload.id)
  yield* put(
    messagesActions.incomingMessages({
      messages: [message],
      isVerified: true,
    })
  )

  const isUploadingFileMessage = action.payload.media?.cid?.includes('uploading')
  console.log('SendMessageSaga - isUploadingFileMessage', isUploadingFileMessage)
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
