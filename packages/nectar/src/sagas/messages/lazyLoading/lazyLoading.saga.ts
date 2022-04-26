import { PayloadAction } from '@reduxjs/toolkit'
import { select } from 'typed-redux-saga'
import { messagesActions } from '../messages.slice'
import { messagesSelectors } from '../messages.selectors'
import { publicChannelsSelectors } from '../../publicChannels/publicChannels.selectors'

export function* lazyLoadingSaga(
  action: PayloadAction<ReturnType<typeof messagesActions.lazyLoading>['payload']>
): Generator {
    /**
    * @param  load  Boolean: true - load more messages; false - reset slice (scrolled to bottom)
    */
    if (action.payload.load) {
        const channelMessagesEntries = yield* select(messagesSelectors.currentPublicChannelMessagesEntries)

        const lastDisplayedMessage = yield* select(publicChannelsSelectors.currentChannelLastDisplayedMessage)
        const lastDisplayedMessageIndex = channelMessagesEntries.indexOf(lastDisplayedMessage)
    
        const channelMessagesChunkSize = 50
    
        const postLoadingLastDisplayedMessage = channelMessagesEntries[lastDisplayedMessageIndex - channelMessagesChunkSize]
    
        // No more messages in database - update cache and set slice to 0
        if (!postLoadingLastDisplayedMessage) {
    
            return
        }
    
        const cachedChannelMessages = yield* select(publicChannelsSelectors.sortedCurrentChannelMessages)
        // Check if last lazy loaded message is present in cached messages and update cache if needed
        if (!cachedChannelMessages.indexOf(postLoadingLastDisplayedMessage)) {
    
        }
    
        // Set slice to be equal last displayed message index
    
        // Update number of messages to display
        
    } else {
        // Set slice to be equal newest message index - chunk size

        // Update numer of messages to display

    }
}
