import { type PayloadAction } from '@reduxjs/toolkit'
import { select, call, put, delay } from 'typed-redux-saga'
import { messagesActions } from '../messages.slice'
import { MessageType, type MessageVerificationStatus } from '@quiet/types'
import { publicChannelsSelectors } from '../../publicChannels/publicChannels.selectors'

import { usersSelectors } from '../../users/users.selectors'
import { verifyUserInfoMessage } from '@quiet/common'

export function* verifyMessagesSaga(
  action: PayloadAction<ReturnType<typeof messagesActions.incomingMessages>>['payload']
): Generator {
  const messages = action.payload.messages

  let ownerData = yield* select(usersSelectors.ownerData)

  while (true) {
    ownerData = yield* select(usersSelectors.ownerData)
    if (ownerData?.pubKey) {
      break
    }
    console.warn('Owner certificate missing!')
    yield* delay(500)
  }

  for (const message of messages) {
    let isVerified = Boolean(action.payload.isVerified)

    if (message.type === MessageType.Info && message.pubKey !== ownerData.pubKey) {
      let user = yield* select(usersSelectors.getUserByPubKey(message.pubKey))

      while (true) {
        user = yield* select(usersSelectors.getUserByPubKey(message.pubKey))
        if (user) {
          break
        }
        yield* delay(500)
      }
      const channel = yield* select(publicChannelsSelectors.getChannelById(message.channelId))
      if (!channel) return

      const expectedMessage = yield* call(verifyUserInfoMessage, user.username, channel)

      if (message.message !== expectedMessage) {
        console.error(`${user.username} tried to send a malicious info message`)
        isVerified = false
      }
    }

    const verificationStatus: MessageVerificationStatus = {
      publicKey: message.pubKey,
      signature: message.signature,
      isVerified,
    }

    yield* put(messagesActions.addMessageVerificationStatus(verificationStatus))
  }
}
