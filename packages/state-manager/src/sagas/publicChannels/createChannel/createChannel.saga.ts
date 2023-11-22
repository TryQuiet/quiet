import { type publicChannelsActions } from '../publicChannels.slice'
import { type PayloadAction } from '@reduxjs/toolkit'

import { apply } from 'typed-redux-saga'

import { type Socket, applyEmitParams } from '../../../types'

import logger from '../../../utils/logger'
import { SocketActionTypes } from '@quiet/types'
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
            channel: action.payload.channel,
        })
    )
}
