import { PayloadAction } from '@reduxjs/toolkit'
import { select, put } from 'typed-redux-saga'
import { publicChannelsActions } from '../publicChannels.slice'
import { publicChannelsSelectors } from '../publicChannels.selectors'
import { messagesActions } from '../../messages/messages.slice'

export function* updateNewestMessageSaga(
  action: PayloadAction<ReturnType<typeof messagesActions.incomingMessages>['payload']>
): Generator {
  const { messages } = action.payload
  const statuses = yield* select(publicChannelsSelectors.channelsStatus)

  for (const message of messages) {
    if (!statuses[message.channelAddress]) return
    if (
      !statuses[message.channelAddress].newestMessage ||
      statuses[message.channelAddress].newestMessage.createdAt < message.createdAt
    ) {
      yield* put(publicChannelsActions.updateNewestMessage({ message }))
    }
  }
}
