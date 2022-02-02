import { select, put } from 'typed-redux-saga'
import { PayloadAction } from '@reduxjs/toolkit'
import { publicChannelsActions } from '../publicChannels.slice'
import { publicChannelsSelectors } from '../publicChannels.selectors'
import { communitiesSelectors } from '../../communities/communities.selectors'
import { ClearUnreadMessagesPayload, MarkUnreadMessagesPayload, UnreadChannelMessage } from '../publicChannels.types'

export function* markUnreadMessagesSaga(
  action: PayloadAction<ReturnType<typeof publicChannelsActions.incomingMessages>['payload']>
): Generator {
  const currentCommunity = yield* select(communitiesSelectors.currentCommunity)
  const currentChannel = yield* select(publicChannelsSelectors.currentChannel)

  const messages = action.payload.messages.filter(message => message.channelAddress !== currentChannel)

  const unread: UnreadChannelMessage[] = messages.map(message => {
    return {
      id: message.id,
      channelAddress: message.channelAddress
    }
  })

  const payload: MarkUnreadMessagesPayload = {
    messages: unread,
    communityId: currentCommunity.id
  }

  yield* put(
    publicChannelsActions.markUnreadMessages(payload)
  )
}

export function* clearUnreadMessagesSaga(
  action: PayloadAction<ReturnType<typeof publicChannelsActions.setCurrentChannel>['payload']>
): Generator {
  const channelAddress = action.payload.channelAddress
  const communityId = action.payload.communityId

  const unread = yield* select(publicChannelsSelectors.unreadMessages)

  const ids = unread
    .filter(message => message.channelAddress === channelAddress)
    .map(message => message.id)

  const payload: ClearUnreadMessagesPayload = {
    ids: ids,
    communityId: communityId
  }

  yield* put(
    publicChannelsActions.clearUnreadMessages(payload)
  )
}
