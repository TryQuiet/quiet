import { select, put } from 'typed-redux-saga'
import { publicChannelsSelectors } from '../../publicChannels/publicChannels.selectors'
import { publicChannelsActions } from '../../publicChannels/publicChannels.slice'
import { messagesSelectors } from '../messages.selectors'
import { messagesActions } from '../messages.slice'
import { CacheMessagesPayload, SetDisplayedMessagesNumberPayload } from '@quiet/types'

export function* resetCurrentPublicChannelCacheSaga(): Generator {
  const channelAddress = yield* select(publicChannelsSelectors.currentChannelAddress)
  if (!channelAddress) return

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
    channelAddress: channelAddress
  }

  yield* put(publicChannelsActions.cacheMessages(cacheMessagesPayload))

  const setDisplayedMessagesNumberPayload: SetDisplayedMessagesNumberPayload = {
    channelAddress: channelAddress,
    display: channelMessagesChunkSize
  }

  yield* put(messagesActions.setDisplayedMessagesNumber(setDisplayedMessagesNumberPayload))
}
