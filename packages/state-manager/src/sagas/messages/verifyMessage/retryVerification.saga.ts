import { type PayloadAction } from '@reduxjs/toolkit'
import { select, put } from 'typed-redux-saga'

import { messagesActions } from '../messages.slice'
import { ChannelMessage, MessagesLoadedPayload } from '@quiet/types'
import { createLogger } from '../../../utils/logger'
import { messagesSelectors } from '../messages.selectors'

const logger = createLogger('retryVerificationSaga')

export function* retryVerificationSaga(
  action: PayloadAction<ReturnType<typeof messagesActions.retryVerification>>['payload']
): Generator {
  const messages: ChannelMessage[] = action.payload.messages || []
  const channelId: string | undefined = action.payload.channelId
  const messageIds: string[] | undefined = action.payload.messageIds
  const retryAll: boolean = action.payload.retryAll || false

  if (retryAll) {
    logger.info('Retrying verification for all messages')
    messages.push(...(yield* select(messagesSelectors.invalidMessagesEntries) || []))
  } else {
    logger.info('Retrying verification for specific messages')
    if (channelId) {
      const channelMessages = yield* select(messagesSelectors.invalidChannelMessagesEntries(channelId)) || []
      if (channelMessages != undefined && channelMessages.length > 0) {
        messages.push(...channelMessages.filter((msg): msg is ChannelMessage => msg !== undefined))
      }
    }

    if (messageIds) {
      const selectedMessages = yield* select(messagesSelectors.messagesByIds(messageIds))
      if (selectedMessages && selectedMessages.length > 0) {
        messages.push(...selectedMessages.filter((msg): msg is ChannelMessage => msg !== undefined))
      }
    }
  }
  const messagesToVerify: MessagesLoadedPayload = {
    messages,
    isVerified: false,
  }

  yield* put(messagesActions.verifyMessages(messagesToVerify))
}
