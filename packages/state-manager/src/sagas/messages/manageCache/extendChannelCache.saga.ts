import { select, put } from 'typed-redux-saga'
import { publicChannelsSelectors } from '../../publicChannels/publicChannels.selectors'
import { publicChannelsActions } from '../../publicChannels/publicChannels.slice'
import { CacheMessagesPayload } from '../../publicChannels/publicChannels.types'
import { messagesSelectors } from '../messages.selectors'
import { messagesActions } from '../messages.slice'
import { SetDisplayedMessagesNumberPayload } from '../messages.types'

export function* extendCurrentPublicChannelCacheSaga(): Generator {
  const channelAddress = yield* select(publicChannelsSelectors.currentChannelAddress)
  if (!channelAddress) return

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
    channelAddress: channelAddress
  }

  yield* put(publicChannelsActions.cacheMessages(cacheMessagesPayload))

  const channelMessagesBase = yield* select(messagesSelectors.currentPublicChannelMessagesBase)
  let display = channelMessagesBase?.display || 0 + channelMessagesChunkSize
  if (display > channelMessagesEntries.length) {
    display = channelMessagesEntries.length
  }

  const setDisplayedMessagesNumberPayload: SetDisplayedMessagesNumberPayload = {
    channelAddress: channelAddress,
    display: display
  }

  yield* put(messagesActions.setDisplayedMessagesNumber(setDisplayedMessagesNumberPayload))
}
