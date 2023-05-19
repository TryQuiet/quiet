import { PayloadAction } from '@reduxjs/toolkit'
import { put, select } from 'typed-redux-saga'
import { communitiesSelectors } from '../../communities/communities.selectors'
import { publicChannelsSelectors } from '../../publicChannels/publicChannels.selectors'
import { messagesActions } from '../messages.slice'
import { WriteMessagePayload, MessageType } from '../messages.types'

export function* sendDeletionMessageSaga(
  action: PayloadAction<ReturnType<typeof messagesActions.sendDeletionMessage>['payload']>
): Generator {
  const { channelId } = action.payload
  const generalChannel = yield* select(publicChannelsSelectors.generalChannel)

  const isGeneral = channelId === generalChannel.id

  const ownerNickname = yield* select(communitiesSelectors.ownerNickname)

  const community = yield* select(communitiesSelectors.currentCommunity)

  const isOwner = Boolean(community?.CA)

  const payload: WriteMessagePayload = {
    type: MessageType.Info,
    message: `@${ownerNickname} deleted #${channelId.slice(0, channelId.indexOf('_'))}`, // TEMPORARY
    channelId: generalChannel.id
  }

  if (isOwner && !isGeneral) {
    yield* put(messagesActions.sendMessage(payload))
  }
}
