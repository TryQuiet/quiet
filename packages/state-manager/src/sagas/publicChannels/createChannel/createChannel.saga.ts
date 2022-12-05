import { publicChannelsActions } from '../publicChannels.slice'
import { PayloadAction } from '@reduxjs/toolkit'
import { SocketActionTypes } from '../../socket/const/actionTypes'

import { apply } from 'typed-redux-saga'

import { Socket } from 'socket.io-client'

import logger from '../../../utils/logger'
const log = logger('publicChannels')

export function* createChannelSaga(
  socket: Socket,
  action: PayloadAction<
  ReturnType<typeof publicChannelsActions.createChannel>['payload']
  >
): Generator {
  log(`Creating channel ${action.payload.channel.name}`)
  yield* apply(socket, socket.emit, [
    SocketActionTypes.CREATE_CHANNEL,
    {
      channel: action.payload.channel
    }
  ])
}
