import { PayloadAction } from '@reduxjs/toolkit'
import { Socket } from 'socket.io-client'
import { communitiesSelectors } from '../../communities/communities.selectors'
import { apply, put, select } from 'typed-redux-saga'
import { SocketActionTypes } from '../../socket/const/actionTypes'
import { publicChannelsActions } from '../publicChannels.slice'
import { PublicChannel } from '../publicChannels.types'

export function* subscribeToTopicSaga(
  socket: Socket,
  action: PayloadAction<ReturnType<typeof publicChannelsActions.subscribeToTopic>['payload']>
): Generator {
  const communityId = yield* select(communitiesSelectors.currentCommunityId)

  const { peerId, channelData } = action.payload

  const channel: PublicChannel = {
    ...channelData,
    messagesSlice: undefined
  }

  yield* put(
    publicChannelsActions.addChannel({
      communityId: communityId,
      channel: channel
    })
  )

  yield* apply(socket, socket.emit, [
    SocketActionTypes.SUBSCRIBE_TO_TOPIC,
    {
      peerId: peerId,
      channelData: channel
    }
  ])
}
