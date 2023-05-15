import { PayloadAction } from '@reduxjs/toolkit'
import { publicChannelsActions } from '../publicChannels.slice'
import { SocketActionTypes } from '../../socket/const/actionTypes'
import { apply, put, select } from 'typed-redux-saga'
import { Socket, applyEmitParams } from '../../../types'
import logger from '../../../utils/logger'

import { publicChannelsSelectors } from '../publicChannels.selectors'
const log = logger('publicChannels')

export function* deleteChannelSaga(
  socket: Socket,
  action: PayloadAction<ReturnType<typeof publicChannelsActions.deleteChannel>['payload']>
): Generator {
  const channelAddress = action.payload.channelAddress
  const generalChannel = yield* select(publicChannelsSelectors.generalChannel)

  const isGeneral = channelAddress === generalChannel.address

  log(`Deleting channel ${channelAddress}`)
  yield* apply(
    socket,
    socket.emit,
    applyEmitParams(SocketActionTypes.DELETE_CHANNEL, {
      channelAddress
    })
  )

  if (!isGeneral) {
    yield* put(publicChannelsActions.setCurrentChannel({ channelAddress: generalChannel.address }))
    yield* put(publicChannelsActions.disableChannel({ channelAddress }))
  }
}
