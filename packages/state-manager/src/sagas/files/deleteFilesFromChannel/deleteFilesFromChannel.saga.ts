import { PayloadAction } from '@reduxjs/toolkit'
import { apply, select } from 'typed-redux-saga'
import { messagesSelectors } from '../../messages/messages.selectors'
import { Socket, applyEmitParams } from '../../../types'
import { SocketActionTypes } from '../../socket/const/actionTypes'
import { filesActions } from '../files.slice'

export function* deleteFilesFromChannelSaga(
  socket: Socket,
  action: PayloadAction<ReturnType<typeof filesActions.deleteFilesFromChannel>['payload']>
): Generator {
  const { channelAddress } = action.payload

  const messages = yield* select(messagesSelectors.publicChannelMessagesEntities(channelAddress))

  yield* apply(
    socket,
    socket.emit,
    applyEmitParams(SocketActionTypes.DELETE_FILES_FROM_CHANNEL, {
      messages
    })
  )
}
