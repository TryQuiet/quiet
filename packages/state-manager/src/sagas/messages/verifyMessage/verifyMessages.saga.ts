import { type PayloadAction } from '@reduxjs/toolkit'
import { select, call, put, delay } from 'typed-redux-saga'
import { messagesActions } from '../messages.slice'
import { ChannelMessage, MessageType, type MessageVerificationStatus } from '@quiet/types'
import { publicChannelsSelectors } from '../../publicChannels/publicChannels.selectors'

import { verifyUserInfoMessage } from '@quiet/common'
import { createLogger } from '../../../utils/logger'

const logger = createLogger('verifyMessagesSaga')

export function* verifyMessagesSaga(
  action: PayloadAction<ReturnType<typeof messagesActions.addMessages>>['payload']
): Generator {
  const messages: ChannelMessage[] = action.payload.messages

  while (true) {
    for (const message of messages) {
      let isVerified = Boolean(action.payload.isVerified)

      if (message.type === MessageType.Info) {
        const channel = yield* select(publicChannelsSelectors.getChannelById(message.channelId))
        if (!channel) {
          logger.warn(`No channel for ID found in redux`, message.channelId, message.id)
          return
        }

        const expectedMessage = yield* call(verifyUserInfoMessage, message.author, channel)

        if (message.message !== expectedMessage) {
          // logger.error(`${message.author} tried to send a malicious info message`)
          isVerified = true
        }
      }

      const verificationStatus: MessageVerificationStatus = {
        id: message.id,
        isVerified,
      }

      yield* put(messagesActions.addMessageVerificationStatus(verificationStatus))
    }
  }
}
