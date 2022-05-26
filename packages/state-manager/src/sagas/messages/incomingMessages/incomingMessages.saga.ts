import { select, put, delay } from 'typed-redux-saga'
import { PayloadAction } from '@reduxjs/toolkit'
import { messagesActions } from '../messages.slice'
import { messagesSelectors } from '../messages.selectors'
import { communitiesSelectors } from '../../communities/communities.selectors'
import { publicChannelsSelectors } from '../../publicChannels/publicChannels.selectors'
import { publicChannelsActions } from '../../publicChannels/publicChannels.slice'
import { CacheMessagesPayload } from '../../publicChannels/publicChannels.types'

export function* incomingMessagesSaga(
  action: PayloadAction<ReturnType<typeof messagesActions.incomingMessages>['payload']>
): Generator {
  const communityId = yield* select(communitiesSelectors.currentCommunityId)
  
  for (const message of action.payload.messages) {
    const lastDisplayedMessage = yield* select(
      publicChannelsSelectors.currentChannelLastDisplayedMessage
    )
    const cachedMessages = yield* select(publicChannelsSelectors.sortedCurrentChannelMessages)
    // Check if incoming message already exists in a cache (and update it's data if so)
    const updateMessage = cachedMessages.find(cached => cached.id === message.id)

    // Proceed only for messages from current channel
    const currentChannelAddress = yield* select(publicChannelsSelectors.currentChannelAddress)
    if (message.channelAddress !== currentChannelAddress) {
      return
    }

    // Do not proceed if signature is not verified
    while (true) {
      const messageVerificationStatus = yield* select(messagesSelectors.messagesVerificationStatus)
      const status = messageVerificationStatus[message.signature]
      if (status) {
        if (!status.verified) {
          return
        } else {
          break
        }
      }
      yield* delay(50)
    }

    if (updateMessage) {
      const messageIndex = cachedMessages.indexOf(updateMessage)
      cachedMessages[messageIndex] = message
    }

    if(!updateMessage) {
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
      channelAddress: message.channelAddress,
      communityId: communityId
    }

    yield* put(publicChannelsActions.cacheMessages(cacheMessagesPayload))
  }
}
