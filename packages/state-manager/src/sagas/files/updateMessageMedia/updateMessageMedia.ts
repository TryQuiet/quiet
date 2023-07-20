import { type PayloadAction } from '@reduxjs/toolkit'
import { select, put } from 'typed-redux-saga'
import { messagesSelectors } from '../../messages/messages.selectors'
import { messagesActions } from '../../messages/messages.slice'
import { type filesActions } from '../files.slice'
import { instanceOfChannelMessage } from '@quiet/types'

export function* updateMessageMediaSaga(
  action: PayloadAction<ReturnType<typeof filesActions.updateMessageMedia>['payload']>
): Generator {
  const channelMessages = yield* select(
    messagesSelectors.publicChannelMessagesEntities(action.payload.message.channelId)
  )

  const message = channelMessages[action.payload.message.id]
  if (!message || !instanceOfChannelMessage(message)) {
    console.error(
      `Cannot update message media. Message ${action.payload.message.id} from #${action.payload.message.channelId} does not exist in local storage.`
    )
    return
  }

  yield* put(
    messagesActions.incomingMessages({
      messages: [
        {
          ...message,
          media: action.payload,
        },
      ],
      isVerified: true,
    })
  )
}
