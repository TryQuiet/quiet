import { type PayloadAction } from '@reduxjs/toolkit'
import { put, select } from 'typed-redux-saga'
import { communitiesSelectors } from '../../communities/communities.selectors'
import { publicChannelsSelectors } from '../../publicChannels/publicChannels.selectors'
import { messagesActions } from '../messages.slice'
import { MessageType, type WriteMessagePayload } from '@quiet/types'
import { deleteChannelMessage } from '@quiet/common'

export function* sendDeletionMessageSaga(
  action: PayloadAction<ReturnType<typeof messagesActions.sendDeletionMessage>['payload']>
): Generator {
  const { channelId, isPublic } = action.payload
  const generalChannel = yield* select(publicChannelsSelectors.generalChannel)
  if (!generalChannel) return
  if (!isPublic) return

  const isGeneral = channelId === generalChannel.id

  const isOwner = yield* select(communitiesSelectors.isOwner)

  const deletedChannel = yield* select(publicChannelsSelectors.getChannelById(channelId))
  const channelName = action.payload.channelName ?? deletedChannel?.name
  if (!channelName) return

  const payload: WriteMessagePayload = {
    type: MessageType.Info,
    message: deleteChannelMessage(channelName),
    channelId: generalChannel.id,
  }

  // TODO: Not just owner can send deletion message post 4.0
  if (isOwner && !isGeneral) {
    yield* put(messagesActions.sendMessage(payload))
  }
}
