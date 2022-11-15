import { PayloadAction } from '@reduxjs/toolkit'
import { select, put } from 'typed-redux-saga'
import { publicChannelsSelectors } from '../publicChannels.selectors'
import { publicChannelsActions } from '../publicChannels.slice'
import { identitySelectors } from '../../identity/identity.selectors'
import { messagesSelectors } from '../../messages/messages.selectors'
import { messagesActions } from '../../messages/messages.slice'

import logger from '@quiet/logger'
const log = logger('channels')

export function* channelsReplicatedSaga(
  action: PayloadAction<ReturnType<typeof publicChannelsActions.channelsReplicated>['payload']>
): Generator {
  log('INSIDE CHANNELS REPLICATED SAGA')

  const _locallyStoredChannels = yield* select(publicChannelsSelectors.publicChannels)
  const locallyStoredChannels = _locallyStoredChannels.map(channel => channel.address)

  const databaseStoredChannels = Object.values(action.payload.channels)

  // Upserting channels to local storage
  for (const channel of databaseStoredChannels) {
    if (!locallyStoredChannels.includes(channel.address)) {
      log(`ADDING #${channel.name} TO LOCAL STORAGE`)
      yield* put(
        publicChannelsActions.addChannel({
          channel: channel
        })
      )
    }
  }

  // const identity = yield* select(identitySelectors.currentIdentity)

  // const subscribedChannels = yield* select(publicChannelsSelectors.subscribedChannels)

  // Subscribing channels
  // for (const channel of databaseStoredChannels) {
  //   if (!subscribedChannels.includes(channel.address)) {
  //     log(`SUBSCRIBING TO #${channel.name}`)

  //     const channelData = {
  //       ...channel,
  //       messages: undefined,
  //       messagesSlice: undefined
  //     }

  //     yield* put(
  //       publicChannelsActions.subscribeToTopic({
  //         peerId: identity.peerId.id,
  //         channel: channelData
  //       })
  //     )
  //   }
  // }

  const currentChannelCache = yield* select(publicChannelsSelectors.currentChannelMessages)
  const currentChannelRepository = yield* select(messagesSelectors.currentPublicChannelMessagesEntries)

  // (On collecting data from persist) Populating displayable data
  if (currentChannelCache.length < 1 && currentChannelRepository.length > 0) {
    yield* put(messagesActions.resetCurrentPublicChannelCache())
  }
}
