import { select, put, delay } from 'typed-redux-saga'
import { type PayloadAction } from '@reduxjs/toolkit'
import { messagesActions } from '../messages.slice'
import { messagesSelectors } from '../messages.selectors'
import { publicChannelsSelectors } from '../../publicChannels/publicChannels.selectors'
import { publicChannelsActions } from '../../publicChannels/publicChannels.slice'
import { type CacheMessagesPayload, type ChannelMessage } from '@quiet/types'
import { createLogger } from '../../../utils/logger'

const logger = createLogger('addMessagesSaga')

export function* addMessagesSaga(
  action: PayloadAction<ReturnType<typeof messagesActions.addMessages>['payload']>
): Generator {
  for (const incomingMessage of action.payload.messages) {
    // Proceed only for messages from current channel
    // TODO: do we still need this check?
    const currentChannelId = yield* select(publicChannelsSelectors.currentChannelId)
    if (incomingMessage.channelId !== currentChannelId) {
      logger.warn(`Skipping message because channel ID is not the current channel ID`, incomingMessage.id)
      continue
    }

    let message: ChannelMessage = incomingMessage

    // Update message media path if draft is present (file hosting case)
    if (incomingMessage.media) {
      const currentPublicChannelEntities = yield* select(messagesSelectors.currentPublicChannelMessagesEntities)
      const messageDraft = currentPublicChannelEntities[incomingMessage.id]

      if (messageDraft?.media?.path) {
        message = {
          ...incomingMessage,
          media: {
            ...incomingMessage.media,
            path: messageDraft.media.path,
          },
        }
      }
    }

    const lastDisplayedMessage = yield* select(publicChannelsSelectors.currentChannelLastDisplayedMessage)

    const cachedMessages = yield* select(publicChannelsSelectors.sortedCurrentChannelMessages)

    const messageToUpdate = cachedMessages.find(cached => cached.id === message.id)

    if (messageToUpdate) {
      // Check if incoming message already exists in a cache (and update it's data if so)
      const messageIndex = cachedMessages.indexOf(messageToUpdate)
      cachedMessages[messageIndex] = message
    } else {
      // Check if incoming message fits between (newest known message)...(number of messages to display)
      if (message.createdAt < lastDisplayedMessage?.createdAt && cachedMessages.length >= 50) {
        continue
      }
      if (cachedMessages.length >= 50) {
        cachedMessages.shift()
      }
      cachedMessages.push(message)
    }

    const cacheMessagesPayload: CacheMessagesPayload = {
      messages: cachedMessages,
      channelId: message.channelId,
    }

    yield* put(publicChannelsActions.cacheMessages(cacheMessagesPayload))
  }
}
