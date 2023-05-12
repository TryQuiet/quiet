import { PayloadAction } from '@reduxjs/toolkit'
import { select, put, call } from 'typed-redux-saga'
import { publicChannelsActions } from '../publicChannels.slice'
import { publicChannelsSelectors } from '../publicChannels.selectors'
import { messagesActions } from '../../messages/messages.slice'
import { MarkUnreadChannelPayload } from '../publicChannels.types'
import { identitySelectors } from '../../identity/identity.selectors'

export function* markUnreadChannelsSaga(
  action: PayloadAction<ReturnType<typeof messagesActions.incomingMessages>['payload']>
): Generator {
  const currentChannelAddress = yield* select(publicChannelsSelectors.currentChannelAddress)

  const { messages } = action.payload

  for (const message of messages) {
    // Do not proceed for current channel
    if (message.channelAddress !== currentChannelAddress) {
      const payload: MarkUnreadChannelPayload = {
        channelAddress: message.channelAddress,
        message: message
      }

      const statuses = yield* select(publicChannelsSelectors.channelsStatus)

      const joinTimestamp = yield* select(identitySelectors.joinTimestamp)

      // For all messages created before user joined don't show notifications
      if (!joinTimestamp || joinTimestamp > message.createdAt * 1000) continue
      // If there are newer messages in the channel, don't show notification
      const newestMessage = statuses[message.channelAddress]?.newestMessage
      if (!newestMessage) continue
      if (newestMessage.createdAt > message.createdAt) continue

      yield* put(
        publicChannelsActions.markUnreadChannel(payload)
      )
    }
  }
}

export function* clearUnreadChannelsSaga(
  action: PayloadAction<ReturnType<typeof publicChannelsActions.setCurrentChannel>['payload']>
): Generator {
  const { channelAddress } = action.payload

  // Do not proceed with invalid channel
  if (channelAddress === '') return

  const payload: MarkUnreadChannelPayload = {
    channelAddress: channelAddress
  }

  yield* put(
    publicChannelsActions.clearUnreadChannel(payload)
  )
}
