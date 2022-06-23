import { PayloadAction } from '@reduxjs/toolkit'
import { Socket } from 'socket.io-client'
import { apply, put } from 'typed-redux-saga'
import { SocketActionTypes } from '../../socket/const/actionTypes'
import { publicChannelsActions } from '../publicChannels.slice'
import { messagesActions } from '../../messages/messages.slice'

export function* subscribeToTopicSaga(
  socket: Socket,
  action: PayloadAction<ReturnType<typeof publicChannelsActions.subscribeToTopic>['payload']>
): Generator {
  const { peerId, channel } = action.payload

  const channelData = {
    ...channel,
    messages: undefined,
    messagesSlice: undefined
  }

  yield* put(
    publicChannelsActions.addChannel({
      channel: channelData
    })
  )

  yield* put(
    messagesActions.addPublicChannelsMessagesBase({
      channelAddress: channel.address
    })
  )

  yield* apply(socket, socket.emit, [
    SocketActionTypes.SUBSCRIBE_TO_TOPIC,
    {
      peerId: peerId,
      channel: channelData
    }
  ])
}
