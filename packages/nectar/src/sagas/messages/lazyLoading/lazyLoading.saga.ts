import { PayloadAction } from '@reduxjs/toolkit'
import { put, select } from 'typed-redux-saga'
import { messagesActions } from '../messages.slice'
import { messagesSelectors } from '../messages.selectors'
import { publicChannelsActions } from '../../publicChannels/publicChannels.slice'
import {
  CacheMessagesPayload,
  RemoveCachedMessagesPayload
} from '../../publicChannels/publicChannels.types'
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
  /**
   * @param  load  Boolean: true - load more messages; false - reset slice (scrolled to bottom)
   */
  if (action.payload.load) {
    const lastDisplayedMessage = yield* select(
      publicChannelsSelectors.currentChannelLastDisplayedMessage
    )
    const lastDisplayedMessageIndex = channelMessagesEntries.indexOf(lastDisplayedMessage)

    const messages = channelMessagesEntries.slice(
      Math.max(0, lastDisplayedMessageIndex - channelMessagesChunkSize),
      lastDisplayedMessageIndex
    )

    const cacheMessagesPayload: CacheMessagesPayload = {
      messages: messages,
      channelAddress: channelAddress,
      communityId: communityId
    }

    // Load more messages to cache
    yield* put(publicChannelsActions.cacheMessages(cacheMessagesPayload))

    // Update number of messages to display
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
    const messages = channelMessagesEntries
      .slice(
        Math.max(0, channelMessagesEntries.length - channelMessagesChunkSize),
        channelMessagesEntries.length
      )
      .map(message => message.id)

    const removeCachedMessagesPayload: RemoveCachedMessagesPayload = {
      messages: messages,
      channelAddress: channelAddress,
      communityId: communityId
    }

    // Remove messages from cache
    yield* put(publicChannelsActions.removeCachedMessages(removeCachedMessagesPayload))

    const setDisplayedMessagesNumberPayload: SetDisplayedMessagesNumberPayload = {
      channelAddress: channelAddress,
      display: channelMessagesChunkSize
    }

    // Reset number of messages to display
    yield* put(messagesActions.setDisplayedMessagesNumber(setDisplayedMessagesNumberPayload))
  }
}
