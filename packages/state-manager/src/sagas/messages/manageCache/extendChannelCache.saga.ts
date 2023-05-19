import { select, put } from 'typed-redux-saga'
import { communitiesSelectors } from '../../communities/communities.selectors'
import { publicChannelsSelectors } from '../../publicChannels/publicChannels.selectors'
import { publicChannelsActions } from '../../publicChannels/publicChannels.slice'
import { CacheMessagesPayload } from '../../publicChannels/publicChannels.types'
import { messagesSelectors } from '../messages.selectors'
import { messagesActions } from '../messages.slice'
import { SetDisplayedMessagesNumberPayload } from '../messages.types'

export function* extendCurrentPublicChannelCacheSaga(): Generator {
  const communityId = yield* select(communitiesSelectors.currentCommunityId)
  const channelId = yield* select(publicChannelsSelectors.currentchannelId)

  const channelMessagesChunkSize = 50

  const channelMessagesEntries = yield* select(
    messagesSelectors.sortedCurrentPublicChannelMessagesEntries
  )

  const lastDisplayedMessage = yield* select(
    publicChannelsSelectors.currentChannelLastDisplayedMessage
  )

  const lastDisplayedMessageIndex = channelMessagesEntries.findIndex(i => i.id === lastDisplayedMessage.id)

  const messages = channelMessagesEntries.slice(
    Math.max(0, lastDisplayedMessageIndex - channelMessagesChunkSize)
  )

  const cacheMessagesPayload: CacheMessagesPayload = {
    messages: messages,
    channelId: channelId
  }

  yield* put(publicChannelsActions.cacheMessages(cacheMessagesPayload))

  const channelMessagesBase = yield* select(messagesSelectors.currentPublicChannelMessagesBase)
  let display = channelMessagesBase.display + channelMessagesChunkSize
  if (display > channelMessagesEntries.length) {
    display = channelMessagesEntries.length
  }

  const setDisplayedMessagesNumberPayload: SetDisplayedMessagesNumberPayload = {
    channelId: channelId,
    display: display
  }

  yield* put(messagesActions.setDisplayedMessagesNumber(setDisplayedMessagesNumberPayload))
}
