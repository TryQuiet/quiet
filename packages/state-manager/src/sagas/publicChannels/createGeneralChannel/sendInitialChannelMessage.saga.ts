import { type PayloadAction } from '@reduxjs/toolkit'
import { put, select, call } from 'typed-redux-saga'
import { messagesActions } from '../../messages/messages.slice'
import { publicChannelsSelectors } from '../publicChannels.selectors'
import { publicChannelsActions } from '../publicChannels.slice'
import { ChannelType, MessageType, type WriteMessagePayload } from '@quiet/types'
import { generalChannelDeletionMessage, createdChannelMessage } from '@quiet/common'
import { userProfileSelectors } from '../../users/userProfile/userProfile.selectors'
import { waitForChannelSubscriptionSaga } from '../waitForChannelSubscription.saga'

export function* sendInitialChannelMessageSaga(
  action: PayloadAction<ReturnType<typeof publicChannelsActions.sendInitialChannelMessage>['payload']>
): Generator {
  const { channelName, channelId, type } = action.payload
  const generalChannel = yield* select(publicChannelsSelectors.generalChannel)
  if (!generalChannel) return
  const isGeneral = channelId === generalChannel.id

  const pendingGeneralChannelRecreation = yield* select(publicChannelsSelectors.pendingGeneralChannelRecreation)

  const user = yield* select(userProfileSelectors.myUserProfile)

  const message =
    pendingGeneralChannelRecreation && isGeneral
      ? yield* call(generalChannelDeletionMessage, user?.nickname || '')
      : yield* call(createdChannelMessage, channelName)

  // if the message is being sent to a regular channel send a visible message, for DMs send an empty message
  const payload: WriteMessagePayload = {
    type: type === ChannelType.CHANNEL ? MessageType.Info : MessageType.Empty,
    message,
    channelId,
  }

  if (isGeneral) {
    yield* put(publicChannelsActions.setCurrentChannel({ channelId }))
    yield* put(publicChannelsActions.finishGeneralRecreation())
  }

  yield* waitForChannelSubscriptionSaga(channelId)
  yield* put(messagesActions.sendMessage(payload))
}
