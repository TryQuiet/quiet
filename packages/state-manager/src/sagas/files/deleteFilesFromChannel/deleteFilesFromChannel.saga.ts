import { type PayloadAction } from '@reduxjs/toolkit'
import { apply, select } from 'typed-redux-saga'
import { messagesSelectors } from '../../messages/messages.selectors'
import { type Socket, applyEmitParams } from '../../../types'
import { SocketActionTypes } from '@quiet/types'
import { type filesActions } from '../files.slice'

import { loggingHandler, LoggerModuleName } from '../../../utils/logger'

const LOGGER = loggingHandler.initLogger([LoggerModuleName.FILES, LoggerModuleName.SAGA, 'deleteFilesFromChannel'])

export function* deleteFilesFromChannelSaga(
  socket: Socket,
  action: PayloadAction<ReturnType<typeof filesActions.deleteFilesFromChannel>['payload']>
): Generator {
  const { channelId } = action.payload
  LOGGER.info(`Deleting files from channelw ith ID ${channelId}`)

  const messages = yield* select(messagesSelectors.publicChannelMessagesEntities(channelId))

  yield* apply(
    socket,
    socket.emit,
    applyEmitParams(SocketActionTypes.DELETE_FILES_FROM_CHANNEL, {
      messages,
    })
  )
}
