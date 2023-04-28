import { PayloadAction } from '@reduxjs/toolkit'
import { put, select } from 'typed-redux-saga'
import { communitiesSelectors } from '../../communities/communities.selectors'
import { messagesActions } from '../../messages/messages.slice'
import { MessageType, WriteMessagePayload } from '../../messages/messages.types'
import { publicChannelsSelectors } from '../publicChannels.selectors'
import { publicChannelsActions } from '../publicChannels.slice'

export function* sendInitialChannelMessageSaga(
  action: PayloadAction<
    ReturnType<typeof publicChannelsActions.sendInitialChannelMessage>['payload']
  >
): Generator {
  const { channelName, channelAddress } = action.payload
  const isGeneral = channelAddress === 'general'

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
    channelAddress: channelAddress
  }

  if (isGeneral) {
    yield* put(publicChannelsActions.finishGeneralRecreation())
  }

  yield* put(messagesActions.sendMessage(payload))
}
