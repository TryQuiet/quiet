import { Socket } from 'socket.io-client'
import { PayloadAction } from '@reduxjs/toolkit'
import { keyFromCertificate, parseCertificate, sign, loadPrivateKey } from '@quiet/identity'
import { call, select, apply } from 'typed-redux-saga'
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

export function* sendMessageSaga(
  socket: Socket,
  action: PayloadAction<ReturnType<typeof messagesActions.sendMessage>['payload']>
): Generator {
  const identity: Identity = yield* select(identitySelectors.currentIdentity)

  const certificate = identity.userCertificate

  const parsedCertificate = yield* call(parseCertificate, certificate)
  const pubKey = yield* call(keyFromCertificate, parsedCertificate)
  const keyObject = yield* call(loadPrivateKey, identity.userCsr.userKey, config.signAlg)

  const signatureArrayBuffer = yield* call(sign, action.payload, keyObject)
  const signature = yield* call(arrayBufferToString, signatureArrayBuffer)

  const currentChannel = yield* select(publicChannelsSelectors.currentChannel)

  const messageId = yield* call(generateMessageId)
  const currentTime = yield* call(getCurrentTime)

  const message: ChannelMessage = {
    id: messageId,
    type: MessageTypes.BASIC,
    message: action.payload,
    createdAt: currentTime,
    channelAddress: currentChannel.address,
    signature,
    pubKey
  }

  yield* apply(socket, socket.emit, [
    SocketActionTypes.SEND_MESSAGE,
    {
      peerId: identity.peerId.id,
      message: message
    }
  ])
}
