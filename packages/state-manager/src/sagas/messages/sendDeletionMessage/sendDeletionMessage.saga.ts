import { PayloadAction } from '@reduxjs/toolkit'
import { put, select } from 'typed-redux-saga'
import { communitiesSelectors } from '../../communities/communities.selectors'
import { publicChannelsSelectors } from '../../publicChannels/publicChannels.selectors'
import { messagesActions } from '../messages.slice'
import { WriteMessagePayload, MessageType } from '../messages.types'

export function* sendDeletionMessageSaga(
  action: PayloadAction<ReturnType<typeof messagesActions.sendDeletionMessage>['payload']>
): Generator {
  const { channelAddress } = action.payload
  const generalChannel = yield* select(publicChannelsSelectors.generalChannel)

  const isGeneral = channelAddress === generalChannel.address

  const ownerNickname = yield* select(communitiesSelectors.ownerNickname)

  const community = yield* select(communitiesSelectors.currentCommunity)

  const isOwner = Boolean(community?.CA)
//  KACPER
  const payload: WriteMessagePayload = {
    type: MessageType.Info,
    message: `@${ownerNickname} deleted #${channelAddress}`,
    channelAddress: generalChannel.address
  }

  if (isOwner && !isGeneral) {
    yield* put(messagesActions.sendMessage(payload))
  }
}
