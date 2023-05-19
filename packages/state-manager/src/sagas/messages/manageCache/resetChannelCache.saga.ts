import { select, put } from 'typed-redux-saga'
import { publicChannelsSelectors } from '../../publicChannels/publicChannels.selectors'
import { publicChannelsActions } from '../../publicChannels/publicChannels.slice'
import { CacheMessagesPayload } from '../../publicChannels/publicChannels.types'
import { messagesSelectors } from '../messages.selectors'
import { messagesActions } from '../messages.slice'
import { SetDisplayedMessagesNumberPayload } from '../messages.types'

export function* resetCurrentPublicChannelCacheSaga(): Generator {
  const channelId = yield* select(publicChannelsSelectors.currentchannelId)

  const channelMessagesChunkSize = 50

  const channelMessagesEntries = yield* select(
    messagesSelectors.sortedCurrentPublicChannelMessagesEntries
  )

  // Do not proceed with empty channel
  if (channelMessagesEntries.length <= 0) return

  const messages = channelMessagesEntries.slice(
    Math.max(0, channelMessagesEntries.length - channelMessagesChunkSize),
    channelMessagesEntries.length
  )

  const cacheMessagesPayload: CacheMessagesPayload = {
    messages: messages,
    channelId: channelId
  }

  yield* put(publicChannelsActions.cacheMessages(cacheMessagesPayload))

  const setDisplayedMessagesNumberPayload: SetDisplayedMessagesNumberPayload = {
    channelId: channelId,
    display: channelMessagesChunkSize
  }

  yield* put(messagesActions.setDisplayedMessagesNumber(setDisplayedMessagesNumberPayload))
}
