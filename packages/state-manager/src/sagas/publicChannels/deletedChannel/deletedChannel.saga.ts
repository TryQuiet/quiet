import { publicChannelsActions } from '../publicChannels.slice'
import { PayloadAction } from '@reduxjs/toolkit'
import logger from '../../../utils/logger'
import { put } from 'typed-redux-saga'
import { messagesActions } from '../../messages/messages.slice'

const log = logger('publicChannels')

export function* deletedChannelSaga(
  action: PayloadAction<ReturnType<typeof publicChannelsActions.deletedChannel>['payload']>
): Generator {
  log(`Deleted channel ${action.payload.channel} saga`)

  const channelAddress = action.payload.channel
  const isGeneral = channelAddress === 'general'

  if (!isGeneral) {
    yield* put(publicChannelsActions.setCurrentChannel({ channelAddress: 'general' }))
  }

  yield* put(publicChannelsActions.clearMessagesCache({ channelAddress }))

  yield* put(messagesActions.deleteMessages({ channelAddress }))

  yield* put(publicChannelsActions.deleteChannelFromStore({ channelAddress }))

  if (isGeneral) {
    yield* put(publicChannelsActions.createGeneralChannel())
  }
}
