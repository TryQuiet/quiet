import { publicChannelsActions } from '../publicChannels.slice'
import { PayloadAction } from '@reduxjs/toolkit'
import { SocketActionTypes } from '../../socket/const/actionTypes'

import { apply } from 'typed-redux-saga'

import { Socket } from '../../../types'

import logger from '../../../utils/logger'
import { applyEmitParams } from '../../../types'
const log = logger('publicChannels')

export function* createChannelSaga(
  socket: Socket,
  action: PayloadAction<ReturnType<typeof publicChannelsActions.createChannel>['payload']>
): Generator {
  log(`Creating channel ${action.payload.channel.name}`)
  yield* apply(
    socket,
    socket.emit,
    applyEmitParams(SocketActionTypes.CREATE_CHANNEL, {
      channel: action.payload.channel
    })
  )
}
