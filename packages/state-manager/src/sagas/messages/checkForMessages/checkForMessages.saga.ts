import { put, select } from 'typed-redux-saga'
import {
  currentPublicChannelMessagesBase,
  missingChannelMessages
} from '../messages.selectors'
import { EntityId, PayloadAction } from '@reduxjs/toolkit'
import { messagesActions } from '../messages.slice'
import { currentCommunity } from '../../communities/communities.selectors'
import { currentIdentity } from '../../identity/identity.selectors'

export function* checkForMessagesSaga(action: PayloadAction<ReturnType<typeof messagesActions.responseSendMessagesIds>['payload']>): Generator {
  const { ids, channelAddress } = action.payload
  let messagesIds: string[] = ids

  if(messagesIds.length === 0){
    const messages = yield* select(currentPublicChannelMessagesBase)
    messagesIds = messages.messages.ids as string[]
  }

  const community = yield* select(currentCommunity)

  const identity = yield* select(currentIdentity)

  const missingMessages = yield* select(missingChannelMessages(messagesIds, channelAddress))

  if (missingMessages.length > 0) {
    yield* put(
      messagesActions.askForMessages({
        peerId: identity.peerId.id,
        communityId: community.id,
        channelAddress: channelAddress,
        ids: missingMessages
      })
    )
  }
}
