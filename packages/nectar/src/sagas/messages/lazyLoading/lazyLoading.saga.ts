import { PayloadAction } from '@reduxjs/toolkit'
import { put, select } from 'typed-redux-saga'
import { messagesActions } from '../messages.slice'
import { messagesSelectors } from '../messages.selectors'
import { publicChannelsActions } from '../../publicChannels/publicChannels.slice'
import { CacheMessagesPayload } from '../../publicChannels/publicChannels.types'
import { publicChannelsSelectors } from '../../publicChannels/publicChannels.selectors'
import { communitiesSelectors } from '../../communities/communities.selectors'
import { SetDisplayedMessagesNumberPayload } from '../messages.types'

export function* lazyLoadingSaga(
  action: PayloadAction<ReturnType<typeof messagesActions.lazyLoading>['payload']>
): Generator {
  const communityId = yield* select(communitiesSelectors.currentCommunityId)
  const channelAddress = yield* select(publicChannelsSelectors.currentChannelAddress)

  const channelMessagesChunkSize = 50

  const channelMessagesEntries = yield* select(
    messagesSelectors.sortedCurrentPublicChannelMessagesEntries
    )

  const cachedChannelMessages = yield* select(publicChannelsSelectors.currentChannelMessages)

  /**
   * Load messages
   * @param  load  Boolean: true - load more messages
   */
  if (action.payload.load) {
    const lastDisplayedMessage = yield* select(
      publicChannelsSelectors.currentChannelLastDisplayedMessage
    )

    const lastDisplayedMessageIndex = channelMessagesEntries.indexOf(lastDisplayedMessage)

    const messages = channelMessagesEntries.slice(
      Math.max(0, lastDisplayedMessageIndex - channelMessagesChunkSize)
    )

    const cacheMessagesPayload: CacheMessagesPayload = {
      messages: messages,
      channelAddress: channelAddress,
      communityId: communityId
    }

    yield* put(publicChannelsActions.cacheMessages(cacheMessagesPayload))

    const channelMessagesBase = yield* select(messagesSelectors.currentPublicChannelMessagesBase)
    const display = Math.max(
      channelMessagesEntries.length,
      channelMessagesBase.display + channelMessagesChunkSize
    )

    const setDisplayedMessagesNumberPayload: SetDisplayedMessagesNumberPayload = {
      channelAddress: channelAddress,
      display: display
    }

    yield* put(messagesActions.setDisplayedMessagesNumber(setDisplayedMessagesNumberPayload))
  } else {
    /**
     * Trim messages
     * @param  load  Boolean: false - reset slice (scrolled to bottom)
     */

    // Do not proceed with empty channel
    if (channelMessagesEntries.length <= 0) return
    // Do not proceed if messages are already trimmed
    if (cachedChannelMessages.length === channelMessagesChunkSize) return

    const messages = channelMessagesEntries
      .slice(
        Math.max(0, channelMessagesEntries.length - channelMessagesChunkSize),
        channelMessagesEntries.length
      )

    const cacheMessagesPayload: CacheMessagesPayload = {
      messages: messages,
      channelAddress: channelAddress,
      communityId: communityId
    }

    yield* put(publicChannelsActions.cacheMessages(cacheMessagesPayload))

    const setDisplayedMessagesNumberPayload: SetDisplayedMessagesNumberPayload = {
      channelAddress: channelAddress,
      display: channelMessagesChunkSize
    }

    yield* put(messagesActions.setDisplayedMessagesNumber(setDisplayedMessagesNumberPayload))
  }
}
