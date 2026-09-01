import { type PayloadAction } from '@reduxjs/toolkit'
import { select, put } from 'typed-redux-saga'
import { publicChannelsActions } from '../publicChannels.slice'
import { publicChannelsSelectors } from '../publicChannels.selectors'
import { type messagesActions } from '../../messages/messages.slice'
import { isMessageTransportVerified } from '../../messages/utils/message.utils'

export function* updateNewestMessageSaga(
  action: PayloadAction<ReturnType<typeof messagesActions.addMessages>['payload']>
): Generator {
  const messages = action.payload.messages.filter(message =>
    isMessageTransportVerified(message, action.payload.isVerified)
  )
  if (messages.length === 0) return
  const statuses = yield* select(publicChannelsSelectors.channelsStatus)

  for (const message of messages) {
    const messageStatus = statuses[message.channelId]
    if (!messageStatus) return
    if (!messageStatus.newestMessage || messageStatus.newestMessage.createdAt < message.createdAt) {
      yield* put(publicChannelsActions.updateNewestMessage({ message }))
    }
  }
}
