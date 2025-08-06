import { type PayloadAction } from '@reduxjs/toolkit'
import { select, put } from 'typed-redux-saga'

import { messagesActions } from '../messages.slice'
import { ChannelMessage, MessagesLoadedPayload } from '@quiet/types'
import { createLogger } from '../../../utils/logger'
import { messagesSelectors } from '../messages.selectors'
import { publicChannelsSelectors } from '../../publicChannels/publicChannels.selectors'

const logger = createLogger('retryVerificationSaga')

export function* retryVerificationSaga(
  action: PayloadAction<ReturnType<typeof messagesActions.retryVerification>>['payload']
): Generator {
  const messages: ChannelMessage[] = action.payload.messages || []
  const channelId: string | undefined = action.payload.channelId
  const messageIds: string[] | undefined = action.payload.messageIds

  if (action.payload.currentChannel) {
    const currentChannelId = yield* select(publicChannelsSelectors.currentChannelId)
    if (currentChannelId) {
      const channelMessages = yield* select(messagesSelectors.invalidChannelMessagesEntries(currentChannelId)) || []
      if (channelMessages != undefined && channelMessages.length > 0) {
        messages.push(...channelMessages.filter((msg): msg is ChannelMessage => msg !== undefined))
      }
    }
  }

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

  const seenIds = new Set<string>()
  const deduped: ChannelMessage[] = []
  for (const m of messages) {
    if (!m) continue
    if (!seenIds.has(m.id)) {
      seenIds.add(m.id)
      deduped.push(m)
    }
  }

  const messagesToVerify: MessagesLoadedPayload = {
    messages: deduped,
    isVerified: false,
  }

  yield* put(messagesActions.verifyMessages(messagesToVerify))
}
