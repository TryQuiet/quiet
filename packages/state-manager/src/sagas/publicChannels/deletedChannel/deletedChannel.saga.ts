import { publicChannelsActions } from '../publicChannels.slice'
import { PayloadAction } from '@reduxjs/toolkit'
import logger from '../../../utils/logger'
import { put, delay } from 'typed-redux-saga'
import { messagesActions } from '../../messages/messages.slice'
import { MessageType, WriteMessagePayload } from '../../messages/messages.types'

const log = logger('publicChannels')

export function* deletedChannelSaga(
  action: PayloadAction<ReturnType<typeof publicChannelsActions.deletedChannel>['payload']>
): Generator {
  log(`Deleted channel ${action.payload.channel} saga`)

  const channelAddress = action.payload.channel
  const isGeneral = channelAddress === 'general'

  if (isGeneral) {
    yield* put(publicChannelsActions.startGeneralRecreation())
  } else {
    yield* put(publicChannelsActions.setCurrentChannel({ channelAddress: 'general' }))
  }

  yield* put(publicChannelsActions.clearMessagesCache({ channelAddress }))

  yield* put(messagesActions.deleteMessages({ channelAddress }))

  yield* put(publicChannelsActions.deleteChannelFromStore({ channelAddress }))

  let message: string

  if (isGeneral) {
    yield* put(publicChannelsActions.createGeneralChannel())
    // For better UX
    yield* delay(500)
    yield* put(publicChannelsActions.finishGeneralRecreation())
    message = '#general has been recreated by owner'
  } else {
    message = `#${channelAddress} has been deleted by owner`
  }

  const payload: WriteMessagePayload = {
    type: MessageType.Info,
    message,
    channelAddress: 'general'
  }

  yield* put(messagesActions.sendMessage(payload))
}
