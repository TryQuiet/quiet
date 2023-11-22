import { applyEmitParams, type Socket } from '../../../types'
import { type PayloadAction } from '@reduxjs/toolkit'
import { select, apply } from 'typed-redux-saga'
import { identitySelectors } from '../../identity/identity.selectors'
import { messagesActions } from '../../messages/messages.slice'
import { SocketActionTypes } from '@quiet/types'

export function* uploadFileSaga(
    socket: Socket,
    action: PayloadAction<ReturnType<typeof messagesActions.addMessagesSendingStatus>['payload']>
) {
    const message = action.payload.message
    if (!message.media) return

    const identity = yield* select(identitySelectors.currentIdentity)
    if (!identity) return

    yield* apply(
        socket,
        socket.emit,
        applyEmitParams(SocketActionTypes.UPLOAD_FILE, {
            file: message.media,
            peerId: identity.peerId.id,
        })
    )
}
