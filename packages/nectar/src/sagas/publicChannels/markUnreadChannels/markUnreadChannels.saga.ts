import { PayloadAction } from '@reduxjs/toolkit'
import { select, put } from 'typed-redux-saga'
import { publicChannelsActions } from '../publicChannels.slice'
import { publicChannelsSelectors } from '../publicChannels.selectors'
import { messagesActions } from '../../messages/messages.slice'
import { MarkUnreadChannelPayload } from '../publicChannels.types'

export function* markUnreadChannelsSaga(
  action: PayloadAction<ReturnType<typeof messagesActions.incomingMessages>['payload']>
): Generator {
  const currentChannelAddress = yield* select(publicChannelsSelectors.currentChannelAddress)

  const { messages, communityId } = action.payload

  for (const message of messages) {
      // Do not proceed for current channel
      if (message.channelAddress !== currentChannelAddress) {
        const payload: MarkUnreadChannelPayload = {
          channelAddress: message.channelAddress,
          communityId: communityId
      }

      yield* put(
        publicChannelsActions.markUnreadChannel(payload)
      )
    }
  }
}

export function* clearUnreadChannelsSaga(
  action: PayloadAction<ReturnType<typeof publicChannelsActions.setCurrentChannel>['payload']>
): Generator {
  const { channelAddress, communityId } = action.payload

  // Do not proceed with invalid channel
  if (channelAddress === '') return

  const payload: MarkUnreadChannelPayload = {
    channelAddress: channelAddress,
    communityId: communityId
  }

  yield* put(
    publicChannelsActions.clearUnreadChannel(payload)
  )
}
