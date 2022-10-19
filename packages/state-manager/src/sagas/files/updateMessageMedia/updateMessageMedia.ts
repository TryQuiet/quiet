import { PayloadAction } from '@reduxjs/toolkit'
import { select, put } from 'typed-redux-saga'
import { messagesSelectors } from '../../messages/messages.selectors'
import { messagesActions } from '../../messages/messages.slice'
import { instanceOfChannelMessage } from '../../publicChannels/publicChannels.types'
import { filesActions } from '../files.slice'

export function* updateMessageMediaSaga(
  action: PayloadAction<ReturnType<typeof filesActions.updateMessageMedia>['payload']>
): Generator {
  const channelMessages = yield* select(
    messagesSelectors.publicChannelMessagesEntities(action.payload.message.channelAddress)
  )

  const message = channelMessages[action.payload.message.id]

  if (!message || !instanceOfChannelMessage(message)) {
    console.error(
      `Cannot update message media. Message ${action.payload.message.id} from #${action.payload.message.channelAddress} does not exist in local storage.`
    )
    return
  }

  yield* put(
    messagesActions.incomingMessages({
      messages: [
        {
          ...message,
          media: action.payload
        }
      ],
      isVerified: true
    })
  )
}
