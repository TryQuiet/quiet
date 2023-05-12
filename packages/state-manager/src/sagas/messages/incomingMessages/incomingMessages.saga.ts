import { select, put, delay } from 'typed-redux-saga'
import { PayloadAction } from '@reduxjs/toolkit'
import { messagesActions } from '../messages.slice'
import { messagesSelectors } from '../messages.selectors'
import { publicChannelsSelectors } from '../../publicChannels/publicChannels.selectors'
import { publicChannelsActions } from '../../publicChannels/publicChannels.slice'
import { CacheMessagesPayload, ChannelMessage } from '../../publicChannels/publicChannels.types'

export function* incomingMessagesSaga(
  action: PayloadAction<ReturnType<typeof messagesActions.incomingMessages>['payload']>
): Generator {
  for (const incomingMessage of action.payload.messages) {
    // Proceed only for messages from current channel
    const currentChannelAddress = yield* select(publicChannelsSelectors.currentChannelAddress)
    if (incomingMessage.channelAddress !== currentChannelAddress) {
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
      const currentPublicChannelEntities = yield* select(
        messagesSelectors.currentPublicChannelMessagesEntities
      )
      const messageDraft = currentPublicChannelEntities[incomingMessage.id]

      if (messageDraft?.media?.path) {
        message = {
          ...incomingMessage,
          media: {
            ...incomingMessage.media,
            path: messageDraft.media.path
          }
        }
      }
    }

    const lastDisplayedMessage = yield* select(
      publicChannelsSelectors.currentChannelLastDisplayedMessage
    )

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
      channelAddress: message.channelAddress
    }

    yield* put(publicChannelsActions.cacheMessages(cacheMessagesPayload))
  }
}
