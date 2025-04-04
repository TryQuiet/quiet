import { type PayloadAction } from '@reduxjs/toolkit'
import { select, call, put, delay } from 'typed-redux-saga'
import { messagesActions } from '../messages.slice'
import { ChannelMessage, MessageType, type MessageVerificationStatus } from '@quiet/types'
import { publicChannelsSelectors } from '../../publicChannels/publicChannels.selectors'

import { verifyUserInfoMessage } from '@quiet/common'
import { createLogger } from '../../../utils/logger'
import { userProfileSelectors } from '../../users/userProfile/userProfile.selectors'

const logger = createLogger('verifyMessagesSaga')

export function* verifyMessagesSaga(
  action: PayloadAction<ReturnType<typeof messagesActions.addMessages>>['payload']
): Generator {
  const messages: ChannelMessage[] = action.payload.messages

  for (const message of messages) {
    let isVerified = !!action.payload.isVerified

    if (message.type === MessageType.Info) {
      logger.info('getting channel for info message', message.channelId, message.id)
      const channel = yield* select(publicChannelsSelectors.getChannelById(message.channelId))
      if (!channel) {
        logger.warn(`No channel for ID found in redux`, message.channelId, message.id)
        return
      }

      const author = yield* select(userProfileSelectors.getUserProfileById(message.userId))
      if (author == null) {
        logger.warn(`No author for ID found in redux`, message.userId, message.id)
        isVerified = false
      } else {
        const expectedMessage = yield* call(verifyUserInfoMessage, author.nickname, channel)

        if (message.message !== expectedMessage) {
          logger.warn(`${author.nickname} tried to send a malicious info message`)
          logger.info('expected', expectedMessage)
          logger.info('actual', message.message)
          isVerified = false
        }
      }
    }

    const verificationStatus: MessageVerificationStatus = {
      id: message.id,
      isVerified,
    }

    yield* put(messagesActions.addMessageVerificationStatus(verificationStatus))
  }
}
