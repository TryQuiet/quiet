import { PayloadAction } from '@reduxjs/toolkit'
import { put } from 'typed-redux-saga'
import { publicChannelsActions } from '../../publicChannels/publicChannels.slice'
import { messagesActions } from '../messages.slice'

export function* updateMessagesSendingStatusSaga(
  action: PayloadAction<ReturnType<typeof publicChannelsActions.incomingMessages>['payload']>
): Generator {
  const messages = action.payload.messages
  for (const message of messages) {
    yield* put(messagesActions.removePendingMessageStatus(message.id))
  }
}
