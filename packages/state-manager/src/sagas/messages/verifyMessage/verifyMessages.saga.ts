import { PayloadAction } from '@reduxjs/toolkit'
import { select, call, put, spawn } from 'typed-redux-saga'
import { messagesActions } from '../messages.slice'
import { MessageVerificationStatus } from '../messages.types'
import { ChannelMessage } from '../../publicChannels/publicChannels.types'
import { messagesSelectors } from '../messages.selectors'

export function* verifyMessagesSaga(
  action: PayloadAction<ReturnType<typeof messagesActions.incomingMessages>>['payload']
): Generator {
  const messages = action.payload.messages
  const verifyStatus = action.payload.verifyStatus

  for (const message of messages) {
    yield* spawn(verifyMessage, message, verifyStatus)
  }
}

function* verifyMessage(message: ChannelMessage, verifyStatus: boolean): Generator {
  const verificationStatus: MessageVerificationStatus = {
    publicKey: message.pubKey,
    signature: message.signature,
    verified: verifyStatus
  }

  yield* put(messagesActions.addMessageVerificationStatus(verificationStatus))
}
