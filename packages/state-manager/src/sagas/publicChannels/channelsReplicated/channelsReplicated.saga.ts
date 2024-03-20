import { type PayloadAction } from '@reduxjs/toolkit'
import { select, put, take } from 'typed-redux-saga'
import { publicChannelsSelectors } from '../publicChannels.selectors'
import { publicChannelsActions } from '../publicChannels.slice'
import { messagesSelectors } from '../../messages/messages.selectors'
import { messagesActions } from '../../messages/messages.slice'
import { communitiesSelectors } from '../../communities/communities.selectors'

import { LoggerModuleName, loggingHandler } from '../../../utils/logger'
import { type PublicChannel } from '@quiet/types'

const LOGGER = loggingHandler.initLogger([
  LoggerModuleName.PUBLIC_CHANNELS,
  LoggerModuleName.SAGA,
  'channelsReplicated',
])

export function* channelsReplicatedSaga(
  action: PayloadAction<ReturnType<typeof publicChannelsActions.channelsReplicated>['payload']>
): Generator {
  LOGGER.info('Syncing channels')
  const { channels } = action.payload
  const _locallyStoredChannels = yield* select(publicChannelsSelectors.publicChannels)
  const locallyStoredChannels = _locallyStoredChannels.map(channel => channel.id)

  // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
  const databaseStoredChannels = Object.values(channels) as PublicChannel[]

  const databaseStoredChannelsIds = databaseStoredChannels.map(channel => channel.id)
  LOGGER.debug(`Stored channels: ${JSON.stringify({ locallyStoredChannels, databaseStoredChannelsIds })}`)

  // Removing channels from store
  if (databaseStoredChannelsIds.length > 0) {
    for (const channelId of locallyStoredChannels) {
      if (!databaseStoredChannelsIds.includes(channelId)) {
        LOGGER.info(`Removing #${channelId} from store`)
        yield* put(publicChannelsActions.deleteChannel({ channelId }))
        yield* take(publicChannelsActions.completeChannelDeletion)
      }
    }
  }

  // Upserting channels to local storage
  for (const channel of databaseStoredChannels) {
    if (!locallyStoredChannels.includes(channel.id)) {
      LOGGER.info(`Adding #${channel.name} to store`)
      yield* put(
        publicChannelsActions.addChannel({
          channel,
        })
      )
      yield* put(
        messagesActions.addPublicChannelsMessagesBase({
          channelId: channel.id,
        })
      )
    }
  }

  const currentChannelCache = yield* select(publicChannelsSelectors.currentChannelMessages)
  const currentChannelRepository = yield* select(messagesSelectors.currentPublicChannelMessagesEntries)

  // (On collecting data from persist) Populating displayable data
  if (currentChannelCache.length < 1 && currentChannelRepository.length > 0) {
    yield* put(messagesActions.resetCurrentPublicChannelCache())
  }

  const community = yield* select(communitiesSelectors.currentCommunity)

  if (!community?.CA && databaseStoredChannels.find(channel => channel.name === 'general')) {
    yield* put(publicChannelsActions.sendIntroductionMessage())
  }
}
