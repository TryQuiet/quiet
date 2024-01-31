import { select, put, delay } from 'typed-redux-saga'
import { type PayloadAction } from '@reduxjs/toolkit'
import { type messagesActions } from '../messages.slice'
import { messagesSelectors } from '../messages.selectors'
import { publicChannelsSelectors } from '../../publicChannels/publicChannels.selectors'
import { publicChannelsActions } from '../../publicChannels/publicChannels.slice'
import { type CacheMessagesPayload, type ChannelMessage } from '@quiet/types'

export function* addMessagesSaga(
  action: PayloadAction<ReturnType<typeof messagesActions.addMessages>['payload']>
): Generator {
  for (const incomingMessage of action.payload.messages) {
    // Proceed only for messages from current channel
    const currentChannelId = yield* select(publicChannelsSelectors.currentChannelId)
    if (incomingMessage.channelId !== currentChannelId) {
      return
    }

    // Do not proceed if signature is not verified
    while (true) {
      const messageVerificationStatus = yield* select(messagesSelectors.messagesVerificationStatus)
      const status = messageVerificationStatus[incomingMessage.signature]
      if (status) {
        if (!status.isVerified) {
          return
        } else {
          break
        }
      }
      yield* delay(50)
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
        return
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
