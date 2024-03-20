import { type PayloadAction } from '@reduxjs/toolkit'
import { apply } from 'typed-redux-saga'
import { type appActions } from './app.slice'
import { type Socket } from '../../types'
import { SocketActionTypes } from '@quiet/types'
import { loggingHandler, LoggerModuleName } from '../../utils/logger'

const LOGGER = loggingHandler.initLogger([LoggerModuleName.APP, LoggerModuleName.SAGA, 'closeServices'])

export function* closeServicesSaga(
  socket: Socket,
  _action: PayloadAction<ReturnType<typeof appActions.closeServices>['payload']>
): Generator {
  LOGGER.info(`Stopping services, emitting ${SocketActionTypes.LEAVE_COMMUNITY} socket event`)
  yield* apply(socket, socket.emit, [SocketActionTypes.LEAVE_COMMUNITY])
}
