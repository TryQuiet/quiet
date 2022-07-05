import { PayloadAction } from '@reduxjs/toolkit'
import { select, put } from 'typed-redux-saga'
import { messagesSelectors } from '../../messages/messages.selectors'
import { messagesActions } from '../../messages/messages.slice'
import { filesActions } from '../files.slice'

export function* updateMessageMediaSaga(
  action: PayloadAction<ReturnType<typeof filesActions.updateMessageMedia>['payload']>
): Generator {
  const channelMessages = yield* select(messagesSelectors.currentPublicChannelMessagesEntities)
  const message = channelMessages[action.payload.message.id]

  yield* put(
    messagesActions.incomingMessages({
      messages: [{
        ...message,
        media: action.payload
      }]
    })
  )
}
