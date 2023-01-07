import { Socket, applyEmitParams } from '../../../types'
import { PayloadAction } from '@reduxjs/toolkit'
import { keyFromCertificate, parseCertificate, sign, loadPrivateKey } from '@quiet/identity'
import { call, select, apply, put } from 'typed-redux-saga'
import { arrayBufferToString } from 'pvutils'
import { config } from '../../users/const/certFieldTypes'
import { SocketActionTypes } from '../../socket/const/actionTypes'
import { identitySelectors } from '../../identity/identity.selectors'
import { publicChannelsSelectors } from '../../publicChannels/publicChannels.selectors'
import { messagesActions } from '../messages.slice'
import { generateMessageId, getCurrentTime } from '../utils/message.utils'
import { Identity } from '../../identity/identity.types'
import { ChannelMessage } from '../../publicChannels/publicChannels.types'
import { MessageType, SendingStatus } from '../messages.types'

export function* sendMessageSaga(
  socket: Socket,
  action: PayloadAction<ReturnType<typeof messagesActions.sendMessage>['payload']>
): Generator {
  const identity: Identity = yield* select(identitySelectors.currentIdentity)

  const certificate = identity.userCertificate

  const parsedCertificate = yield* call(parseCertificate, certificate)
  const pubKey = yield* call(keyFromCertificate, parsedCertificate)
  const keyObject = yield* call(loadPrivateKey, identity.userCsr.userKey, config.signAlg)

  const signatureArrayBuffer = yield* call(sign, action.payload.message, keyObject)
  const signature = yield* call(arrayBufferToString, signatureArrayBuffer)

  const currentChannel = yield* select(publicChannelsSelectors.currentChannelAddress)

  const createdAt = yield* call(getCurrentTime)

  const generatedMessageId = yield* call(generateMessageId)
  const id = action.payload.id || generatedMessageId

  const channelAddress = action.payload.channelAddress || currentChannel

  const message: ChannelMessage = {
    id: id,
    type: action.payload.type || MessageType.Basic,
    message: action.payload.message,
    media: action.payload.media,
    createdAt,
    channelAddress,
    signature,
    pubKey
  }

  // Grey out message until saved in db
  yield* put(
    messagesActions.addMessagesSendingStatus({
      id: message.id,
      status: SendingStatus.Pending
    })
  )

  // Mark own message as properly signed
  yield* put(
    messagesActions.addMessageVerificationStatus({
      publicKey: message.pubKey,
      signature: message.signature,
      isVerified: true
    })
  )

  // Display sent message immediately, to improve user experience
  yield* put(
    messagesActions.incomingMessages({
      messages: [message],
      isVerified: true
    })
  )

  const isUploadingFileMessage = action.payload.media?.cid?.includes('uploading')
  if (isUploadingFileMessage) return // Do not broadcast message until file is uploaded

  yield* apply(
    socket,
    socket.emit,
    applyEmitParams(SocketActionTypes.SEND_MESSAGE, {
      peerId: identity.peerId.id,
      message: message
    })
  )
}
