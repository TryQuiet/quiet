import { type PayloadAction } from '@reduxjs/toolkit'
import { select, put } from 'typed-redux-saga'
import { publicChannelsActions } from '../publicChannels.slice'
import { publicChannelsSelectors } from '../publicChannels.selectors'
import { type messagesActions } from '../../messages/messages.slice'
import { identitySelectors } from '../../identity/identity.selectors'
import { type MarkUnreadChannelPayload } from '@quiet/types'
import { identityActions } from '../../identity/identity.slice'
import { communitiesSelectors } from '../../communities/communities.selectors'

export function* markUnreadChannelsSaga(
  action: PayloadAction<ReturnType<typeof messagesActions.incomingMessages>['payload']>
): Generator {
  const currentChannelId = yield* select(publicChannelsSelectors.currentChannelId)

  const { messages } = action.payload

  // Fix for users whose has damaged property with join timestamp and problem with proper checking new message
  yield* put(identityActions.verifyJoinTimestamp())

  for (const message of messages) {
    // Do not proceed for current channel
    if (message.channelId !== currentChannelId) {
      const payload: MarkUnreadChannelPayload = {
        channelId: message.channelId,
        message,
      }

      const statuses = yield* select(publicChannelsSelectors.channelsStatus)

      const joinTimestamp = yield* select(identitySelectors.joinTimestamp)

      // For all messages created before user joined don't show notifications
      if (!joinTimestamp || joinTimestamp > message.createdAt * 1000) continue
      // If there are newer messages in the channel, don't show notification
      const newestMessage = statuses[message.channelId]?.newestMessage
      if (newestMessage?.createdAt && newestMessage.createdAt > message.createdAt) continue
      yield* put(publicChannelsActions.markUnreadChannel(payload))
    }
  }
}

export function* clearUnreadChannelsSaga(
  action: PayloadAction<ReturnType<typeof publicChannelsActions.setCurrentChannel>['payload']>
): Generator {
  const { channelId } = action.payload

  // Do not proceed with invalid channel
  if (channelId === '') return

  const payload: MarkUnreadChannelPayload = {
    channelId,
  }

  yield* put(publicChannelsActions.clearUnreadChannel(payload))
}
