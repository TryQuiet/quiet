import { type PayloadAction } from '@reduxjs/toolkit'
import { put, select } from 'typed-redux-saga'
import { communitiesSelectors } from '../../communities/communities.selectors'
import { publicChannelsSelectors } from '../../publicChannels/publicChannels.selectors'
import { messagesActions } from '../messages.slice'
import { MessageType, type WriteMessagePayload } from '@quiet/types'
import { userProfileSelectors } from '../../users/userProfile/userProfile.selectors'
import { deleteChannelMessage } from '@quiet/common'

export function* sendDeletionMessageSaga(
  action: PayloadAction<ReturnType<typeof messagesActions.sendDeletionMessage>['payload']>
): Generator {
  const { channelId } = action.payload
  const generalChannel = yield* select(publicChannelsSelectors.generalChannel)
  if (!generalChannel) return

  const user = yield* select(userProfileSelectors.myUserProfile)

  const isGeneral = channelId === generalChannel.id

  const isOwner = yield* select(communitiesSelectors.isOwner)

  const channelName = channelId.slice(0, channelId.indexOf('_'))

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
