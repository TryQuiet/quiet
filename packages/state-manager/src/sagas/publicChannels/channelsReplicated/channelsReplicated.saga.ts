import { PayloadAction } from '@reduxjs/toolkit'
import { select, put } from 'typed-redux-saga'
import { publicChannelsSelectors } from '../publicChannels.selectors'
import { publicChannelsActions } from '../publicChannels.slice'
import { messagesSelectors } from '../../messages/messages.selectors'
import { messagesActions } from '../../messages/messages.slice'

import logger from '@quiet/logger'
import { isDefined } from '@quiet/common'
const log = logger('channels')

export function* channelsReplicatedSaga(
  action: PayloadAction<ReturnType<typeof publicChannelsActions.channelsReplicated>['payload']>
): Generator {
  log('INSIDE CHANNELS REPLICATED SAGA')

  const _locallyStoredChannels = yield* select(publicChannelsSelectors.publicChannels)
  const locallyStoredChannels = _locallyStoredChannels.map(channel => channel.address)

  const databaseStoredChannels = Object.values(action.payload.channels).filter(isDefined)
  const databaseStoredChannelsAddresses = databaseStoredChannels.map(channel => channel.address)
  console.log({ locallyStoredChannels, databaseStoredChannelsAddresses })
  // Upserting channels to local storage
  for (const channel of databaseStoredChannels) {
    if (!locallyStoredChannels.includes(channel.address)) {
      log(`ADDING #${channel.name} TO LOCAL STORAGE`)
      yield* put(
        publicChannelsActions.addChannel({
          channel: channel
        })
      )
      yield* put(
        messagesActions.addPublicChannelsMessagesBase({
          channelAddress: channel.address
        })
      )
    }
  }

  // Removing channels from store
  for (const channelAddress of locallyStoredChannels) {
    if (!databaseStoredChannelsAddresses.includes(channelAddress)) {
      console.log({ channelAddress })
      log(`REMOVING #${channelAddress} FROM STORE`)
      yield* put(publicChannelsActions.deleteChannel({ channel: channelAddress }))
    }
  }

  const currentChannelCache = yield* select(publicChannelsSelectors.currentChannelMessages)
  const currentChannelRepository = yield* select(
    messagesSelectors.currentPublicChannelMessagesEntries
  )

  // (On collecting data from persist) Populating displayable data
  if (currentChannelCache.length < 1 && currentChannelRepository.length > 0) {
    yield* put(messagesActions.resetCurrentPublicChannelCache())
  }
}
