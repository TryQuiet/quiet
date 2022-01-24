import { PayloadAction } from '@reduxjs/toolkit'
import { select, call, put, spawn } from 'typed-redux-saga'
import { getCrypto } from 'pkijs'
import { publicChannelsActions } from '../../publicChannels/publicChannels.slice'
import { messagesSelectors } from '../messages.selectors'
import { stringToArrayBuffer } from 'pvutils'
import { keyObjectFromString, verifySignature } from '@zbayapp/identity'
import { messagesActions } from '../messages.slice'
import { MessageVerificationStatus } from '../messages.types'
import { ChannelMessage } from '../../publicChannels/publicChannels.types'

export function* verifyMessagesSaga(
  action: PayloadAction<ReturnType<typeof publicChannelsActions.incomingMessages>>['payload']
): Generator {
  const crypto = getCrypto()
  const messages = action.payload.messages
  for (const message of messages) {
    yield* spawn(verifyMessage, message, crypto)
  }
}

function* verifyMessage(message: ChannelMessage, crypto: SubtleCrypto): Generator {
  const signature = stringToArrayBuffer(message.signature)

  const publicKeysMapping = yield* select(messagesSelectors.publicKeysMapping)
  console.log(publicKeysMapping)

  let cryptoKey = publicKeysMapping[message.pubKey]
  if (!cryptoKey) {
    cryptoKey = yield* call(keyObjectFromString, message.pubKey, crypto)
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
