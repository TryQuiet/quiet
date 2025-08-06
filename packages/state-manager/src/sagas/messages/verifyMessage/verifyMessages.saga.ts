import { type PayloadAction } from '@reduxjs/toolkit'
import { select, call, put } from 'typed-redux-saga'

import { messagesActions } from '../messages.slice'
import { ChannelMessage, MessageType, type MessageVerificationStatus } from '@quiet/types'
import { generalChannel, publicChannelsSelectors } from '../../publicChannels/publicChannels.selectors'
import { deleteChannelMessageRegex, generalChannelDeletionMessageRegex, verifyUserInfoMessage } from '@quiet/common'
import { createLogger } from '../../../utils/logger'
import { userProfileSelectors } from '../../users/userProfile/userProfile.selectors'

const logger = createLogger('verifyMessagesSaga')

export function* verifyMessagesSaga(
  action: PayloadAction<ReturnType<typeof messagesActions.addMessages>>['payload']
): Generator {
  const messages: ChannelMessage[] = action.payload.messages

  for (const message of messages) {
    let isVerified = true
    const author = yield* select(userProfileSelectors.getUserProfileById(message.userId))
    if (author === null) {
      logger.warn(`No author for ID found in redux`, message.userId, message.id)
      isVerified = false
    } else if (message.type === MessageType.Info) {
      logger.info('getting channel for info message', message.channelId, message.id)
      const channel = yield* select(publicChannelsSelectors.getChannelById(message.channelId))
      if (!channel) {
        logger.warn(`No channel for ID found in redux`, message.channelId, message.id)
        continue
      }

      // Handle channel deletion info messages sent to #general
      if (channel.name === 'general' && deleteChannelMessageRegex.test(message.message)) {
        logger.debug('Trusting deletion message until we have a better solution')
      } else if (generalChannelDeletionMessageRegex.test(message.message)) {
        logger.debug('Trusting deletion message until we have a better solution')
      } else {
        const expectedMessage = yield* call(verifyUserInfoMessage, author.nickname, author.userId, channel)
        if (message.message !== expectedMessage) {
          logger.warn(`${author.nickname} tried to send a malicious info message`)
          logger.info('Expected message:', expectedMessage)
          logger.info('Received message:', message.message)
          isVerified = false
        }
      }
    }

    const verificationStatus: MessageVerificationStatus = {
      id: message.id,
      isVerified,
    }

    logger.debug('Message verification status:', verificationStatus)
    yield* put(messagesActions.addMessageVerificationStatus(verificationStatus))
  }
}
