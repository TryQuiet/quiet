import { put, select } from 'typed-redux-saga'
import { messagesSelectors, missingChannelMessages } from '../messages.selectors'
import { type PayloadAction } from '@reduxjs/toolkit'
import { messagesActions } from '../messages.slice'
import { currentCommunity } from '../../communities/communities.selectors'
import { currentIdentity } from '../../identity/identity.selectors'

export function* checkForMessagesSaga(
  action: PayloadAction<ReturnType<typeof messagesActions.checkForMessages>['payload']>
): Generator {
  const { ids, channelId } = action.payload

  const community = yield* select(currentCommunity)

  const identity = yield* select(currentIdentity)
  if (!community || !identity) return

  const channelMessagesBase = yield* select(messagesSelectors.publicChannelsMessagesBase)
  if (!channelMessagesBase[channelId]) {
    yield* put(messagesActions.addPublicChannelsMessagesBase({ channelId }))
  }

  const missingMessages = yield* select(missingChannelMessages(ids, channelId))

  if (missingMessages?.length > 0) {
    yield* put(
      messagesActions.getMessages({
        peerId: identity.networkInfo.peerId.id,
        communityId: community.id,
        channelId,
        ids: missingMessages,
      })
    )
  }
}
