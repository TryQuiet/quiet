import { put, select } from 'typed-redux-saga'
import {
  missingChannelMessages
} from '../messages.selectors'
import { PayloadAction } from '@reduxjs/toolkit'
import { messagesActions } from '../messages.slice'
import { currentCommunity } from '../../communities/communities.selectors'
import { currentIdentity } from '../../identity/identity.selectors'

export function* checkForMessagesSaga(action: PayloadAction<ReturnType<typeof messagesActions.responseSendMessagesIds>['payload']>): Generator {
  const { ids, channelId } = action.payload

  const community = yield* select(currentCommunity)

  const identity = yield* select(currentIdentity)
  if (!community || !identity) return

  const missingMessages = yield* select(missingChannelMessages(ids, channelId))

  if (missingMessages?.length > 0) {
    yield* put(
      messagesActions.askForMessages({
        peerId: identity.peerId.id,
        communityId: community.id,
        channelId: channelId,
        ids: missingMessages
      })
    )
  }
}
