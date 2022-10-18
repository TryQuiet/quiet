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

  for (const message of messages) {
    const verificationStatus: MessageVerificationStatus = {
      publicKey: message.pubKey,
      signature: message.signature,
      isVerified: action.payload.isVerified
    }

    yield* put(messagesActions.addMessageVerificationStatus(verificationStatus))
  }
}
