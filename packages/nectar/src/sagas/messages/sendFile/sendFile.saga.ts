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
import { MessageType, SendingStatus } from '../messages.types'

export function* sendFileSaga(
  socket: Socket,
  action: PayloadAction<ReturnType<typeof messagesActions.sendMessage>['payload']>
): Generator {
  const payload = action.payload
  payload['type'] = MessageType.IMAGE
  yield* call(messagesActions.sendMessage, payload)
}
