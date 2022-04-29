import { select, put, delay } from 'typed-redux-saga'
import { PayloadAction } from '@reduxjs/toolkit'
import { messagesActions } from '../messages.slice'
import { publicChannelsSelectors } from '../../publicChannels/publicChannels.selectors'
import { publicChannelsActions } from '../../publicChannels/publicChannels.slice'
import { CacheMessagesPayload } from '../../publicChannels/publicChannels.types'
import { messagesSelectors } from '../messages.selectors'

export function* incomingMessagesSaga(
  action: PayloadAction<ReturnType<typeof messagesActions.incomingMessages>['payload']>
): Generator {
  for (const message of action.payload.messages) {
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

    const lastDisplayedMessage = yield* select(publicChannelsSelectors.currentChannelLastDisplayedMessage)
    const cachedMessages = yield* select(publicChannelsSelectors.sortedCurrentChannelMessages)
    // Check if incoming message fits between (newest known message)...(number of messages to display)
    
    if (message.createdAt < lastDisplayedMessage?.createdAt && cachedMessages.length >= 50) {
      return
    }

    if (cachedMessages.length >= 50) {
      cachedMessages.shift()
    }
    cachedMessages.push(message)

    const cacheMessagesPayload: CacheMessagesPayload = {
      messages: cachedMessages,
      channelAddress: message.channelAddress,
      communityId: action.payload.communityId
    }

    yield* put(publicChannelsActions.cacheMessages(cacheMessagesPayload))
  }
}
