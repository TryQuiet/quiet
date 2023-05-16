import { PayloadAction } from '@reduxjs/toolkit'
import { put } from 'typed-redux-saga'
import { messagesActions } from '../messages.slice'
import { MessageVerificationStatus } from '@quiet/types'

export function* verifyMessagesSaga(
  action: PayloadAction<ReturnType<typeof messagesActions.incomingMessages>>['payload']
): Generator {
  const messages = action.payload.messages

  for (const message of messages) {
    const verificationStatus: MessageVerificationStatus = {
      publicKey: message.pubKey,
      signature: message.signature,
      isVerified: Boolean(action.payload.isVerified)
    }

    yield* put(messagesActions.addMessageVerificationStatus(verificationStatus))
  }
}
