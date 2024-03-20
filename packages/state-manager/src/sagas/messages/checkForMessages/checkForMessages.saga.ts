import { put, select } from 'typed-redux-saga'
import { missingChannelMessages } from '../messages.selectors'
import { type PayloadAction } from '@reduxjs/toolkit'
import { messagesActions } from '../messages.slice'
import { currentCommunity } from '../../communities/communities.selectors'
import { currentIdentity } from '../../identity/identity.selectors'
import { loggingHandler, LoggerModuleName } from '../../../utils/logger'

const LOGGER = loggingHandler.initLogger([LoggerModuleName.MESSAGES, LoggerModuleName.SAGA, 'checkForMessages'])

export function* checkForMessagesSaga(
  action: PayloadAction<ReturnType<typeof messagesActions.checkForMessages>['payload']>
): Generator {
  const { ids, channelId } = action.payload

  const community = yield* select(currentCommunity)

  const identity = yield* select(currentIdentity)
  if (!community || !identity) {
    LOGGER.warn(`Must have valid current community and identity to check messages!`)
    return
  }

  const missingMessages = yield* select(missingChannelMessages(ids, channelId))

  if (missingMessages?.length > 0) {
    yield* put(
      messagesActions.getMessages({
        peerId: identity.peerId.id,
        communityId: community.id,
        channelId,
        ids: missingMessages,
      })
    )
  }
}
