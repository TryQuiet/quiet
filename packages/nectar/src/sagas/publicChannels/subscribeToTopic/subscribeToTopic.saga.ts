import { PayloadAction } from '@reduxjs/toolkit'
import { Socket } from 'socket.io-client'
import { communitiesSelectors } from '../../communities/communities.selectors'
import { apply, put, select } from 'typed-redux-saga'
import { SocketActionTypes } from '../../socket/const/actionTypes'
import { publicChannelsActions } from '../publicChannels.slice'

export function* subscribeToTopicSaga(
  socket: Socket,
  action: PayloadAction<
  ReturnType<typeof publicChannelsActions.subscribeToTopic>['payload']
  >
): Generator {
  const id = yield* select(communitiesSelectors.currentCommunityId)
  yield* put(
    publicChannelsActions.addChannel({
      communityId: id,
      channel: action.payload.channelData
    })
  )

  yield* apply(socket, socket.emit, [
    SocketActionTypes.SUBSCRIBE_TO_TOPIC,
    action.payload.peerId,
    action.payload.channelData
  ])
}
