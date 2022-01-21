import { PayloadAction } from '@reduxjs/toolkit'
import { select, call, put } from 'typed-redux-saga'
import { publicChannelsActions } from '../../publicChannels/publicChannels.slice'
import { messagesSelectors } from '../messages.selectors'
import { stringToArrayBuffer } from 'pvutils'
import { keyObjectFromString, verifySignature } from '@zbayapp/identity'
import { messagesActions } from '../messages.slice'
import { MessageVerificationStatus } from '../messages.types'

export function* verifyMessageSaga(
  action: PayloadAction<ReturnType<typeof publicChannelsActions.onMessagePosted>>['payload']
): Generator {
  const message = action.payload.message

  const signature = stringToArrayBuffer(message.signature)

  const publicKeysMapping = yield* select(messagesSelectors.publicKeysMapping)

  let cryptoKey = publicKeysMapping[message.pubKey]
  if (!cryptoKey) {
    cryptoKey = yield* call(keyObjectFromString, message.pubKey, this.crypto)
    yield* put(
      messagesActions.addPublicKeyMapping({ publicKey: message.pubKey, cryptoKey: cryptoKey })
    )
  }

  const verified = yield* call(verifySignature, signature, message.message, cryptoKey)

  const verificationStatus: MessageVerificationStatus = {
      publicKey: message.pubKey,
      signature: message.signature,
      verified: verified
  }

  yield* put(messagesActions.addMessageVerificationStatus(verificationStatus))
}
