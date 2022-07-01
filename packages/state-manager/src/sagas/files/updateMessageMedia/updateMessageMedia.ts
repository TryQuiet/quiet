import { PayloadAction } from '@reduxjs/toolkit'
import { select, put } from 'typed-redux-saga'
import { messagesSelectors } from '../../messages/messages.selectors'
import { messagesActions } from '../../messages/messages.slice'
import { filesActions } from '../files.slice'
import { FileMetadata } from '../files.types'

export function* updateMessageMediaSaga(
  action: PayloadAction<ReturnType<typeof filesActions.updateMessageMedia>['payload']>
): Generator {
  const { id, channelAddress } = action.payload.message

  const messagesBase = yield* select(messagesSelectors.publicChannelsMessagesBase)

  const channelMessages = messagesBase[channelAddress]
  const messages = Object.values(channelMessages.messages.entities)

  let media: FileMetadata = action.payload

  let message = messages.find(message => message.id === id)

  const isAlreadyLocallyStored = message.media?.path ? true : false
  if (isAlreadyLocallyStored) {
    media = {
      ...media,
      path: message.media.path
    }
  }

  message = {
    ...message,
    media: media
  }

  yield* put(
    messagesActions.incomingMessages({
      messages: [message]
    })
  )
}
