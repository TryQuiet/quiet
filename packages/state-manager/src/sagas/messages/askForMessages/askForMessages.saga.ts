import { type PayloadAction } from '@reduxjs/toolkit'
import { type Socket, applyEmitParams } from '../../../types'
import { apply } from 'typed-redux-saga'
import { type messagesActions } from '../messages.slice'
import { SocketActionTypes } from '@quiet/types'

export function* askForMessagesSaga(
    socket: Socket,
    action: PayloadAction<ReturnType<typeof messagesActions.askForMessages>['payload']>
): Generator {
    yield* apply(socket, socket.emit, applyEmitParams(SocketActionTypes.ASK_FOR_MESSAGES, action.payload))
}
