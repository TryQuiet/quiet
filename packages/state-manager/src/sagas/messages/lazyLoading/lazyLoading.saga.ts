import { type PayloadAction } from '@reduxjs/toolkit'
import { put, select } from 'typed-redux-saga'
import { messagesActions } from '../messages.slice'
import { publicChannelsSelectors } from '../../publicChannels/publicChannels.selectors'

export function* lazyLoadingSaga(
  action: PayloadAction<ReturnType<typeof messagesActions.lazyLoading>['payload']>
): Generator {
  const channelMessagesChunkSize = 50
  const cachedChannelMessages = yield* select(publicChannelsSelectors.currentChannelMessages)
  if (action.payload.load) {
    /**
     * Load messages
     * @param  load  Boolean: true - load more messages
     */
    yield* put(messagesActions.extendCurrentPublicChannelCache())
  } else {
    /**
     * Trim messages
     * @param  load  Boolean: false - reset slice (scrolled to bottom)
     */

    // Do not proceed if messages are already trimmed
    if (cachedChannelMessages.length === channelMessagesChunkSize) return

    yield* put(messagesActions.resetCurrentPublicChannelCache())
  }
}
