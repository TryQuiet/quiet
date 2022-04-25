import { select, put } from 'typed-redux-saga'
import { PayloadAction } from '@reduxjs/toolkit'
import { messagesActions } from '../../messages/messages.slice'
import { messagesSelectors } from '../../messages/messages.selectors'
import { publicChannelsSelectors } from '../publicChannels.selectors'
import { publicChannelsActions } from '../publicChannels.slice'
import { CacheMessagesPayload } from '../publicChannels.types'
import { communitiesSelectors } from '../../communities/communities.selectors'

export function* incomingMessagesSaga(
  action: PayloadAction<
  ReturnType<typeof messagesActions.incomingMessages>['payload']
  >
): Generator {
    const { messages } = action.payload

    const currentCommunity = yield* select(communitiesSelectors.currentCommunity)
    const currentChannelAddress = yield* select(publicChannelsSelectors.currentChannelAddress)
    const publicChannelsMessagesBase = yield* select(messagesSelectors.publicChannelsMessagesBase)

    for (const message of messages) {
        const channelAddress = message.channelAddress

        // Proceed only for messages from current channel
        if (channelAddress !== currentChannelAddress) {
            return
        }
        
        const messageChannelBase = publicChannelsMessagesBase[channelAddress]

        // Check if incoming message fits between (newest known message)...(number of messages to display)
        const slicedCurrentChannelMessages = yield* select(publicChannelsSelectors.slicedCurrentChannelMessages)
        const lastDisplayedMessage = slicedCurrentChannelMessages[messageChannelBase.display - 1]
        if (message.createdAt < lastDisplayedMessage?.createdAt) {
            return
        }
        
        // Check if incoming message is newer than last known message (and update it if so)
        if (messageChannelBase.newest === null ||  message.createdAt >= messageChannelBase.newest.createdAt) {
            yield* put(messagesActions.updateNewestKnownMessage(message))
        }
        
        const cacheMessagesPayload: CacheMessagesPayload = {
            messages: [message],
            channelAddress: channelAddress,
            communityId: currentCommunity.id
        }

        yield* put(publicChannelsActions.cacheMessages(cacheMessagesPayload))
    }
}
