import { type PayloadAction } from '@reduxjs/toolkit'
import { publicChannelsActions } from '../publicChannels.slice'
import { apply, put, select } from 'typed-redux-saga'
import { type Socket, applyEmitParams } from '../../../types'
import { filesActions } from '../../files/files.slice'
import { SocketActionTypes } from '@quiet/types'
import { publicChannelsSelectors } from '../publicChannels.selectors'
import { usersSelectors } from '../../users/users.selectors'

export function* deleteChannelSaga(
  socket: Socket,
  action: PayloadAction<ReturnType<typeof publicChannelsActions.deleteChannel>['payload']>
): Generator {
  const channelId = action.payload.channelId
  const generalChannel = yield* select(publicChannelsSelectors.generalChannel)
  const currentChannelId = yield* select(publicChannelsSelectors.currentChannelId)
  const ownerData = yield* select(usersSelectors.ownerData)
  const payloadChannel = yield* select(publicChannelsSelectors.getChannelById(channelId))

  if (generalChannel === undefined) return
  if (payloadChannel?.disabled) return

  const isGeneral = channelId === generalChannel.id

  console.info(`Deleting channel ${channelId}`)

  const response = yield* apply(
    socket,
    socket.emitWithAck,
    applyEmitParams(SocketActionTypes.DELETE_CHANNEL, {
      channelId,
      ownerPeerId: ownerData?.peerId,
    })
  )

  yield* put(filesActions.deleteFilesFromChannel({ channelId }))

  if (!isGeneral) {
    if (currentChannelId === channelId) {
      yield* put(publicChannelsActions.setCurrentChannel({ channelId: generalChannel.id }))
    }
    yield* put(publicChannelsActions.disableChannel({ channelId }))
  }

  yield* put(publicChannelsActions.channelDeletionResponse(response))
}
