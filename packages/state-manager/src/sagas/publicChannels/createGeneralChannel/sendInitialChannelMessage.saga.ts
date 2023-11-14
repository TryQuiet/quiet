import { type PayloadAction } from '@reduxjs/toolkit'
import { put, select } from 'typed-redux-saga'
import { messagesActions } from '../../messages/messages.slice'
import { publicChannelsSelectors } from '../publicChannels.selectors'
import { publicChannelsActions } from '../publicChannels.slice'
import { MessageType, type WriteMessagePayload } from '@quiet/types'
import { identitySelectors } from '../../identity/identity.selectors'

export function* sendInitialChannelMessageSaga(
  action: PayloadAction<ReturnType<typeof publicChannelsActions.sendInitialChannelMessage>['payload']>
): Generator {
  const { channelName, channelId } = action.payload
  const generalChannel = yield* select(publicChannelsSelectors.generalChannel)
  if (!generalChannel) return
  const isGeneral = channelId === generalChannel.id

  const pendingGeneralChannelRecreation = yield* select(publicChannelsSelectors.pendingGeneralChannelRecreation)

  const user = yield* select(identitySelectors.currentIdentity)

  const message =
    pendingGeneralChannelRecreation && isGeneral
      ? `@${user?.nickname} deleted all messages in #general`
      : `@${user?.nickname} created #${channelName}`

  const payload: WriteMessagePayload = {
    type: MessageType.Info,
    message,
    channelId,
  }

  if (isGeneral) {
    yield* put(publicChannelsActions.finishGeneralRecreation())
  }

  yield* put(messagesActions.sendMessage(payload))
}
