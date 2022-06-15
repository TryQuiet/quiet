import { PayloadAction } from '@reduxjs/toolkit'
import { put } from 'typed-redux-saga'
import { messagesActions } from '../../messages/messages.slice'
import { MessageType, WriteMessagePayload } from '../../messages/messages.types'
import { publicChannelsActions } from '../publicChannels.slice'

export function* sendInitialChannelMessageSaga(
  action: PayloadAction<ReturnType<typeof publicChannelsActions.sendInitialChannelMessage>['payload']>
): Generator {
  const { channelName, channelAddress } = action.payload

  const payload: WriteMessagePayload = {
    type: MessageType.Info,
    message: `Created #${channelName}`,
    channelAddress: channelAddress
  }

  yield* put(messagesActions.sendMessage(payload))
}
