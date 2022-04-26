import { select, put } from 'typed-redux-saga'
import { PayloadAction } from '@reduxjs/toolkit'
import { messagesActions } from '../messages.slice'
import { messagesSelectors } from '../messages.selectors'
import { publicChannelsSelectors } from '../../publicChannels/publicChannels.selectors'
import { publicChannelsActions } from '../../publicChannels/publicChannels.slice'
import { CacheMessagesPayload } from '../../publicChannels/publicChannels.types'

export function* incomingMessagesSaga(
  action: PayloadAction<ReturnType<typeof messagesActions.incomingMessages>['payload']>
): Generator {
  for (const message of action.payload.messages) {
    // Proceed only for messages from current channel
    const currentChannelAddress = yield* select(publicChannelsSelectors.currentChannelAddress)
    if (message.channelAddress !== currentChannelAddress) {
      return
    }

    const lastDisplayedMessage = yield* select(publicChannelsSelectors.currentChannelLastDisplayedMessage)
    const messageChannelBase = yield* select(messagesSelectors.currentPublicChannelMessagesBase)
    
    // Check if incoming message fits between (newest known message)...(number of messages to display)
    if (message.createdAt < lastDisplayedMessage?.createdAt) {
      return
    }
        
    // Check if incoming message is newer than last known message (and update it if so)
    if (
      messageChannelBase.newest === null ||
      message.createdAt >= messageChannelBase.newest.createdAt
    ) {
      yield* put(messagesActions.updateNewestKnownMessage(message))
    }

    const cacheMessagesPayload: CacheMessagesPayload = {
      messages: [message],
      channelAddress: message.channelAddress,
      communityId: action.payload.communityId
    }

    yield* put(publicChannelsActions.cacheMessages(cacheMessagesPayload))
  }
}
