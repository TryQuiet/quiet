import { publicChannelsActions } from '../publicChannels.slice'
import { PayloadAction } from '@reduxjs/toolkit'
import { SocketActionTypes } from '../../socket/const/actionTypes'

import logger from '../../../utils/logger'
import { select, put } from 'typed-redux-saga'
import { publicChannelsSelectors } from '../publicChannels.selectors'
import { messagesActions } from '../../messages/messages.slice'

const log = logger('publicChannels')

export function* deletedChannelSaga(
  action: PayloadAction<ReturnType<typeof publicChannelsActions.deletedChannel>['payload']>
): Generator {
  log(`Deleted channel ${action.payload.channel} saga`)
  const channelAddress = action.payload.channel

  // Set channel to general
  yield* put(publicChannelsActions.setCurrentChannel({ channelAddress: 'general' }))

  // Clear messages cache
  yield* put(publicChannelsActions.clearMessagesCache({ channelAddress }))

  // Delete messages
  yield* put(messagesActions.deleteMessages({ channelAddress }))

  // Delete channel
  yield* put(publicChannelsActions.deleteChannelFromStore({ channelAddress }))

  // check
  const locallyStoredChannels2 = yield* select(publicChannelsSelectors.publicChannels)

  console.log({ locallyStoredChannels2 })
}
