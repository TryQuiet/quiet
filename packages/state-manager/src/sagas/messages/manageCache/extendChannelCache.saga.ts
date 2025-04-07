import { select, put } from 'typed-redux-saga'
import { publicChannelsSelectors } from '../../publicChannels/publicChannels.selectors'
import { publicChannelsActions } from '../../publicChannels/publicChannels.slice'
import { messagesSelectors } from '../messages.selectors'
import { messagesActions } from '../messages.slice'
import { type CacheMessagesPayload, type SetDisplayedMessagesNumberPayload } from '@quiet/types'
import { createLogger } from '../../../utils/logger'

const logger = createLogger('extendChannelCacheSaga')

export function* extendCurrentPublicChannelCacheSaga(): Generator {
  const channelId = yield* select(publicChannelsSelectors.currentChannelId)
  const currentChannelId = yield* select(publicChannelsSelectors.currentChannelId)
  if (!currentChannelId || !channelId) {
    logger.warn('Tried to extend channel cache, but no current channel ID was found')
    return
  }

  const channelMessagesChunkSize = 50

  const channelMessagesEntries = yield* select(messagesSelectors.sortedCurrentPublicChannelMessagesEntries)
  logger.info('channelMessagesEntries', channelMessagesEntries)

  const lastDisplayedMessage = yield* select(publicChannelsSelectors.currentChannelLastDisplayedMessage)
  logger.info('lastDisplayedMessage', lastDisplayedMessage)

  const lastDisplayedMessageIndex = channelMessagesEntries.findIndex(i => i.id === lastDisplayedMessage.id)
  logger.info('lastDisplayedMessageIndex', lastDisplayedMessageIndex)

  const messages = channelMessagesEntries.slice(Math.max(0, lastDisplayedMessageIndex - channelMessagesChunkSize))
  logger.info('messages', messages)

  const cacheMessagesPayload: CacheMessagesPayload = {
    messages,
    channelId,
  }

  yield* put(publicChannelsActions.cacheMessages(cacheMessagesPayload))

  const channelMessagesBase = yield* select(messagesSelectors.currentPublicChannelMessagesBase)
  logger.info('channelMessagesBase', channelMessagesBase)
  const baseDisplay = channelMessagesBase?.display || 0
  logger.info('baseDisplay', baseDisplay)
  let display = baseDisplay + channelMessagesChunkSize
  logger.info('display', display)
  if (display > channelMessagesEntries.length) {
    display = channelMessagesEntries.length
    logger.info('display > channelMessagesEntries.length', display)
  }

  const setDisplayedMessagesNumberPayload: SetDisplayedMessagesNumberPayload = {
    channelId,
    display,
  }
  logger.info('setDisplayedMessagesNumberPayload', setDisplayedMessagesNumberPayload)
  yield* put(messagesActions.setDisplayedMessagesNumber(setDisplayedMessagesNumberPayload))
}
