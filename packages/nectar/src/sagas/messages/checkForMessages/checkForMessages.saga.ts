import { put, select } from 'typed-redux-saga'
import {
  missingChannelsMessages
} from '../messages.selectors'
import { PayloadAction } from '@reduxjs/toolkit'
import { currentChannel } from '../../publicChannels/publicChannels.selectors'
import { messagesActions } from '../messages.slice'
import { currentCommunityId } from '../../communities/communities.selectors'
import { currentIdentity } from '../../identity/identity.selectors'

export function* checkForMessagesSaga(action: PayloadAction<ReturnType<typeof messagesActions.responseSendMessagesIds>['payload']>): Generator {
  const communityId = yield* select(currentCommunityId)
  const identity = yield* select(currentIdentity)
  const channel = yield* select(currentChannel)
  const missingMessages = yield* select(missingChannelsMessages(action.payload.ids, action.payload.channelAddress))
  console.log('INSIDE CHECK FOR MESSAGES', action.payload)
  if (missingMessages.length > 0) {
    yield* put(
      messagesActions.askForMessages({
        peerId: identity.peerId.id,
        communityId: communityId,
        channelAddress: channel.address,
        ids: missingMessages
      })
    )
  }
}