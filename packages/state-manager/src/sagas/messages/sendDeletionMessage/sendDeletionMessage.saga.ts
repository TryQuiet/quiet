import { PayloadAction } from '@reduxjs/toolkit'
import { put, select } from 'typed-redux-saga'
import { communitiesSelectors } from '../../communities/communities.selectors'
import { messagesActions } from '../messages.slice'
import { MessageType, WriteMessagePayload } from '@quiet/types'

export function* sendDeletionMessageSaga(
  action: PayloadAction<ReturnType<typeof messagesActions.sendDeletionMessage>['payload']>
): Generator {
  const { channelAddress } = action.payload
  const isGeneral = channelAddress === 'general'

  const ownerNickname = yield* select(communitiesSelectors.ownerNickname)

  const community = yield* select(communitiesSelectors.currentCommunity)

  const isOwner = Boolean(community?.CA)

  const payload: WriteMessagePayload = {
    type: MessageType.Info,
    message: `@${ownerNickname} deleted #${channelAddress}`,
    channelAddress: 'general'
  }

  if (isOwner && !isGeneral) {
    yield* put(messagesActions.sendMessage(payload))
  }
}
