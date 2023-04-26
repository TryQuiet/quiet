import { PayloadAction } from '@reduxjs/toolkit'
import { put, select } from 'typed-redux-saga'
import { communitiesSelectors } from '../../communities/communities.selectors'
import { messagesActions } from '../messages.slice'
import { WriteMessagePayload, MessageType } from '../messages.types'

export function* sendDeletionMessageSaga(
  action: PayloadAction<ReturnType<typeof messagesActions.sendDeletionMessage>['payload']>
): Generator {
  console.log('xdddddd elo')
  const { channelAddress } = action.payload
  const isGeneral = channelAddress === 'general'

  const ownerNickname = yield* select(communitiesSelectors.ownerNickname)

  const community = yield* select(communitiesSelectors.currentCommunity)

  const isOwner = Boolean(community?.CA)

  let message: string

  if (isGeneral) {
    message = `#general has been recreated by @${ownerNickname}`
  } else {
    message = `@${ownerNickname} deleted #${channelAddress}`
  }

  const payload: WriteMessagePayload = {
    type: MessageType.Info,
    message,
    channelAddress: 'general'
  }

  if (isOwner) {
    yield* put(messagesActions.sendMessage(payload))
  }
}
