import { select, put } from 'typed-redux-saga'
import { publicChannelsSelectors } from '../../publicChannels/publicChannels.selectors'
import { publicChannelsActions } from '../../publicChannels/publicChannels.slice'
import { messagesSelectors } from '../messages.selectors'
import { messagesActions } from '../messages.slice'
import { type CacheMessagesPayload, type SetDisplayedMessagesNumberPayload } from '@quiet/types'

export function* resetCurrentPublicChannelCacheSaga(): Generator {
  const channelId = yield* select(publicChannelsSelectors.currentChannelId)
  if (!channelId) return

  const channelMessagesChunkSize = 50

  const channelMessagesEntries = yield* select(messagesSelectors.sortedCurrentPublicChannelMessagesEntries)

  // Do not proceed with empty channel
  if (channelMessagesEntries.length <= 0) return

  const messages = channelMessagesEntries.slice(
    Math.max(0, channelMessagesEntries.length - channelMessagesChunkSize),
    channelMessagesEntries.length
  )

  const cacheMessagesPayload: CacheMessagesPayload = {
    messages,
    channelId,
  }

  yield* put(publicChannelsActions.cacheMessages(cacheMessagesPayload))

  const setDisplayedMessagesNumberPayload: SetDisplayedMessagesNumberPayload = {
    channelId,
    display: channelMessagesChunkSize,
  }

  yield* put(messagesActions.setDisplayedMessagesNumber(setDisplayedMessagesNumberPayload))
}
