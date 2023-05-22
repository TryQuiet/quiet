import { PayloadAction } from '@reduxjs/toolkit'
import { put, select } from 'typed-redux-saga'
import { communitiesSelectors } from '../../communities/communities.selectors'
import { messagesActions } from '../../messages/messages.slice'
import { publicChannelsSelectors } from '../publicChannels.selectors'
import { publicChannelsActions } from '../publicChannels.slice'
import { MessageType, WriteMessagePayload } from '@quiet/types'

export function* sendInitialChannelMessageSaga(
  action: PayloadAction<
    ReturnType<typeof publicChannelsActions.sendInitialChannelMessage>['payload']
  >
): Generator {
  const { channelName, channelId } = action.payload
  const generalChannel = yield* select(publicChannelsSelectors.generalChannel)
  if (!generalChannel) return
  const isGeneral = channelId === generalChannel.id

  const pendingGeneralChannelRecreation = yield* select(
    publicChannelsSelectors.pendingGeneralChannelRecreation
  )

  const ownerNickname = yield* select(communitiesSelectors.ownerNickname)

  const message =
    pendingGeneralChannelRecreation && isGeneral
      ? `@${ownerNickname} deleted all messages in #general`
      : `Created #${channelName}`

  const payload: WriteMessagePayload = {
    type: MessageType.Info,
    message,
    channelId: channelId
  }

  if (isGeneral) {
    yield* put(publicChannelsActions.finishGeneralRecreation())
  }

  yield* put(messagesActions.sendMessage(payload))
}
