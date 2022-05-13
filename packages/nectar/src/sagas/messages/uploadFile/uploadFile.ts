import { Socket } from 'socket.io-client'
import { PayloadAction } from '@reduxjs/toolkit'
import { keyFromCertificate, parseCertificate, sign, loadPrivateKey } from '@quiet/identity'
import { call, select, apply, put } from 'typed-redux-saga'
import { arrayBufferToString } from 'pvutils'
import { config } from '../../users/const/certFieldTypes'
import { SocketActionTypes } from '../../socket/const/actionTypes'
import { identitySelectors } from '../../identity/identity.selectors'
import { publicChannelsSelectors } from '../../publicChannels/publicChannels.selectors'
import { messagesActions } from '../messages.slice'
import { MessageTypes } from '../const/messageTypes'
import { generateMessageId, getCurrentTime } from '../utils/message.utils'
import { Identity } from '../../identity/identity.types'
import { ChannelMessage } from '../../publicChannels/publicChannels.types'
import { SendingStatus } from '../messages.types'
import { FileContent } from '../../files/files.types'

export function* uploadFileSaga(
  socket: Socket,
  action: PayloadAction<ReturnType<typeof messagesActions.uploadFile>['payload']>
): Generator {
  const identity: Identity = yield* select(identitySelectors.currentIdentity)

  const certificate = identity.userCertificate

  const parsedCertificate = yield* call(parseCertificate, certificate)
  const pubKey = yield* call(keyFromCertificate, parsedCertificate)
  const keyObject = yield* call(loadPrivateKey, identity.userCsr.userKey, config.signAlg)

  const signatureArrayBuffer = yield* call(sign, action.payload.buffer, keyObject)
  const signature = yield* call(arrayBufferToString, signatureArrayBuffer)

  const currentChannel = yield* select(publicChannelsSelectors.currentChannelAddress)

  const messageId = yield* call(generateMessageId)
  const currentTime = yield* call(getCurrentTime)

  const channelAddress = action.payload.channelAddress || currentChannel

  const fileContent: FileContent = {
    buffer: action.payload.buffer,
    name: 'name',
    ext: 'ext',
    dir: 'dir'
  }

  const message: ChannelMessage = {
    id: messageId,
    type: MessageTypes.IMAGE,
    message: action.payload.buffer,
    createdAt: currentTime,
    channelAddress,
    signature,
    pubKey
  }

  yield* apply(socket, socket.emit, [
    SocketActionTypes.UPLOAD_FILE,
    {
      file: fileContent,
      peerId: identity.peerId.id
    }
  ])

  // Grey out message until saved in db
  yield* put(messagesActions.addMessagesSendingStatus({
    id: messageId,
    status: SendingStatus.Pending
  }))

  // Mark own message as properly signed
  yield* put(messagesActions.addMessageVerificationStatus({
    publicKey: pubKey,
    signature: signature,
    verified: true
  }))

  // Display sent message immediately, to improve user experience
  yield* put(messagesActions.incomingMessages({
    messages: [message],
    communityId: identity.id
  }))
}
