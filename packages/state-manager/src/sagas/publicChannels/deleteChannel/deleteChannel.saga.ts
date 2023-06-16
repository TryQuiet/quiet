import { type PayloadAction } from '@reduxjs/toolkit'
import { publicChannelsActions } from '../publicChannels.slice'
import { apply, put, select } from 'typed-redux-saga'
import { type Socket, applyEmitParams } from '../../../types'
import logger from '../../../utils/logger'
import { filesActions } from '../../files/files.slice'
import { SocketActionTypes } from '@quiet/types'
import { publicChannelsSelectors } from '../publicChannels.selectors'
import { usersSelectors } from '../../users/users.selectors'

const log = logger('publicChannels')

export function* deleteChannelSaga(
  socket: Socket,
  action: PayloadAction<ReturnType<typeof publicChannelsActions.deleteChannel>['payload']>
): Generator {
  const channelId = action.payload.channelId
  const generalChannel = yield* select(publicChannelsSelectors.generalChannel)
  const currentChannelId = yield* select(publicChannelsSelectors.currentChannelId)
  const ownerData = yield* select(usersSelectors.ownerData)
  const payloadChannel = yield* select(publicChannelsSelectors.getChannelById(channelId))

  if (generalChannel === undefined) {
    return
  }

  if (payloadChannel?.disabled) return

  const isGeneral = channelId === generalChannel.id

  log(`Deleting channel ${channelId}`)
  yield* apply(
    socket,
    socket.emit,
    applyEmitParams(SocketActionTypes.DELETE_CHANNEL, {
      channelId,
      ownerPeerId: ownerData.peerId
    })
  )

  yield* put(filesActions.deleteFilesFromChannel({ channelId }))

  if (!isGeneral) {
    if (currentChannelId === channelId) {
      yield* put(publicChannelsActions.setCurrentChannel({ channelId: generalChannel.id }))
    }
    yield* put(publicChannelsActions.disableChannel({ channelId }))
  }
}
